import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';

export interface PaymentDialogData {
  fromUserName: string;
  fromUserId: string;
  totalOwed: number;
}

@Component({
  selector: 'app-payment-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatIconModule, CurrencyPipe],
  template: `
    <h2 mat-dialog-title>Zahlung von {{ data.fromUserName }}</h2>
    <mat-dialog-content>
      <p>Offener Betrag: <strong>{{ data.totalOwed | currency:'EUR' }}</strong></p>

      <mat-checkbox [(ngModel)]="fullAmount" (change)="onFullAmountChange()">
        Vollen Betrag bezahlt
      </mat-checkbox>

      <mat-form-field appearance="outline" style="width:100%; margin-top:16px" [class.hidden]="fullAmount">
        <mat-label>Betrag (EUR)</mat-label>
        <input matInput type="number" [(ngModel)]="amount" min="0.01" [max]="data.totalOwed" step="0.01" [disabled]="fullAmount" />
        <mat-icon matPrefix>euro</mat-icon>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-raised-button color="primary" (click)="confirm()" [disabled]="!isValid">Bestätigen</button>
    </mat-dialog-actions>
  `,
  styles: [`.hidden { display: none; }`],
})
export class PaymentDialog {
  fullAmount = true;
  amount: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
    private dialogRef: MatDialogRef<PaymentDialog>,
  ) {
    this.amount = data.totalOwed;
  }

  onFullAmountChange(): void {
    if (this.fullAmount) {
      this.amount = this.data.totalOwed;
    }
  }

  get isValid(): boolean {
    return this.amount > 0 && this.amount <= this.data.totalOwed;
  }

  confirm(): void {
    if (!this.isValid) return;
    this.dialogRef.close(this.amount);
  }
}
