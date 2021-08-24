import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardEvent, DataLoading, Organization, Project, User } from '@compito/api-interfaces';
import { ProjectsCreateModalComponent } from '@compito/web/projects';
import { ProjectsAction } from '@compito/web/projects/state';
import { Breadcrumb, ToastService } from '@compito/web/ui';
import { UsersAction, UsersState } from '@compito/web/users/state';
import { DialogService } from '@ngneat/dialog';
import { Select, Store } from '@ngxs/store';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { OrgsAction } from '../../state/orgs.actions';
import { OrgsState } from '../../state/orgs.state';
@Component({
  selector: 'compito-orgs-detail',
  templateUrl: './orgs-detail.component.html',
  styles: [
    `
      .orgs {
        &__container {
          @apply pb-6 pt-4;
          &:not(:last-child) {
            @apply border-b;
          }
        }
        &__list {
          @apply pt-2;
          @apply grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4;
        }
      }
    `,
  ],
})
export class OrgsDetailComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [
    { label: 'Home', link: '/' },
    { label: 'Orgs', link: '/orgs' },
  ];
  selectedMembers = new Map<string, User>();
  @Select(UsersState.getAllUsers)
  users$!: Observable<User[]>;

  @Select(OrgsState.getOrgDetail)
  orgDetails$!: Observable<Organization | null>;

  @Select(OrgsState.orgDetailLoading)
  orgDetailLoading$!: Observable<DataLoading>;

  constructor(
    private dialog: DialogService,
    private store: Store,
    private activatedRoute: ActivatedRoute,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    if (this.orgId) {
      this.store.dispatch(new OrgsAction.Get(this.orgId));
      this.store.dispatch(new UsersAction.GetAll({}));
      this.orgDetails$.pipe().subscribe((org) => {
        if (org && org?.members?.length > 0) {
          org?.members.forEach((member) => {
            this.selectedMembers.set(member.id, member);
          });
        }
      });
    }
  }

  toggleMembers(user: User) {
    if (this.selectedMembers.has(user.id)) {
      this.selectedMembers.delete(user.id);
    } else {
      this.selectedMembers.set(user.id, user);
    }
  }

  removeMember(memberId: string) {
    this.store.dispatch(new OrgsAction.UpdateMembers(this.orgId, { type: 'modify', remove: [memberId] }));
  }

  updateMembers() {
    const members = [...this.selectedMembers.keys()];
    this.store.dispatch(new OrgsAction.UpdateMembers(this.orgId, { type: 'set', set: members }));
  }

  openProjectModal(initialData: any = null, isUpdateMode = false) {
    const ref = this.dialog.open(ProjectsCreateModalComponent, {
      data: {
        initialData,
        isUpdateMode,
        users$: this.users$,
      },
    });
    ref.afterClosed$
      .pipe(
        switchMap((data) => {
          if (data) {
            const action = isUpdateMode
              ? this.store.dispatch(new ProjectsAction.Update(initialData.id, data))
              : this.store.dispatch(new ProjectsAction.Add(data));
            action.pipe(
              // Reopen the modal with the filled data if fails
              catchError(() => {
                this.openProjectModal(data);
                this.toast.error('Failed to create project!');
                return throwError(new Error('Failed to create project!'));
              }),
            );
          }
          return of(null);
        }),
      )
      .subscribe();
  }

  handleProjectCardEvents({ type, payload }: CardEvent, project: Project) {
    switch (type) {
      case 'edit': {
        const data = {
          id: project.id,
          name: project.name,
          description: project.description,
          members: project.members.map(({ id }) => id),
        };
        this.openProjectModal(data, true);
        break;
      }
      case 'delete': {
        this.store
          .dispatch(new ProjectsAction.Delete(project.id))
          .pipe(
            catchError((error) => {
              this.toast.error(error?.error?.message ?? 'Failed to delete project');
              return EMPTY;
            }),
          )
          .subscribe();
        break;
      }
      default:
        break;
    }
  }

  handleUserSelectEvent({ type, payload }: CardEvent) {
    switch (type) {
      case 'toggle':
        this.toggleMembers(payload);
        break;
      case 'save':
        this.updateMembers();
        break;
    }
  }
  private get orgId() {
    return this.activatedRoute.snapshot.params?.id || null;
  }
}
