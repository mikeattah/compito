import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

@Component({
  selector: 'compito-projects-create-modal',
  template: `
    <compito-modal title="Add New Project" [ref]="ref">
      <p>Something</p>

      <ng-template compitoModalActions>
        <div class="flex justify-end space-x-4">
          <button btn variant="secondary" (click)="ref.close()">Close</button>
          <button btn variant="primary">Create</button>
        </div>
      </ng-template>
    </compito-modal>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsCreateModalComponent implements OnInit {
  constructor(public ref: DialogRef) {}

  ngOnInit(): void {}
}
