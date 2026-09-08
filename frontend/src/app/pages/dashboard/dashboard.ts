import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Group, User, GroupRole } from '../../models/api.models';
@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatDialogModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage implements OnInit {
  groups: Group[] = [];

  constructor(
    private api: ApiService,
    protected auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadGroups();
  }

  loadGroups(): void {
    const userId = this.auth.currentUserId();
    if (userId) {
      this.api.getGroups(userId).subscribe(groups => this.groups = groups);
    }
  }

  openGroup(group: Group): void {
    this.router.navigate(['/groups', group.id]);
  }

  openCreateGroup(): void {
    const ref = this.dialog.open(CreateGroupDialog, { width: '450px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadGroups();
    });
  }

  getMemberCount(group: Group): number {
    return group.members.length;
  }
}

// Create Group Dialog
@Component({
  selector: 'app-create-group-dialog',
  imports: [FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Neue Gruppe</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Beschreibung</mat-label>
        <input matInput [(ngModel)]="description" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-raised-button color="primary" (click)="create()" [disabled]="!name">Erstellen</button>
    </mat-dialog-actions>
  `,
})
export class CreateGroupDialog {
  name = '';
  description = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private dialogRef: MatDialogRef<CreateGroupDialog>,
  ) {}

  create(): void {
    const userId = this.auth.currentUserId();
    if (!userId || !this.name) return;
    this.api.createGroup({
      name: this.name,
      description: this.description,
      members: [{ userId, role: GroupRole.ADMIN }],
    }).subscribe(() => {
      this.dialogRef.close(true);
    });
  }
}
