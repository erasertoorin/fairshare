import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { switchMap, tap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { GroupDetail, User, GroupRole } from '../../models/api.models';

export interface AddMemberDialogData {
  group: GroupDetail;
}

@Component({
  selector: 'app-add-member-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Mitglied hinzufügen</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>User</mat-label>
        <mat-select [(ngModel)]="selectedUserId">
          @for (user of availableUsers; track user.id) {
            <mat-option [value]="user.id">{{ user.name }} ({{ user.email }})</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Rolle</mat-label>
        <mat-select [(ngModel)]="selectedRole">
          <mat-option [value]="3">Admin</mat-option>
          <mat-option [value]="2">Editor</mat-option>
          <mat-option [value]="1">Viewer</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-raised-button color="primary" (click)="add()" [disabled]="!selectedUserId">Hinzufuegen</button>
    </mat-dialog-actions>
  `,
})
export class AddMemberDialog implements OnInit {
  availableUsers: User[] = [];
  selectedUserId = '';
  selectedRole: GroupRole = GroupRole.EDITOR;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddMemberDialogData,
    private dialogRef: MatDialogRef<AddMemberDialog>,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    const existingIds = new Set(this.data.group.members.map(m => m.userId));
    this.api.getUsers().pipe(
      tap(users => this.availableUsers = users.filter(u => !existingIds.has(u.id)))
    ).subscribe();
  }

  add(): void {
    if (!this.selectedUserId) return;
    const updatedMembers = [
      ...this.data.group.members,
      { userId: this.selectedUserId, role: this.selectedRole },
    ];
    this.api.updateGroup(this.data.group.id, { members: updatedMembers } as any).pipe(
      tap(() => this.dialogRef.close(true))
    ).subscribe();
  }
}
