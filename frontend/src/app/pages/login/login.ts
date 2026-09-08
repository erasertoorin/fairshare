import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/api.models';

@Component({
  selector: 'app-login',
  imports: [FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatListModule, MatIconModule, MatTabsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage implements OnInit {
  users: User[] = [];
  registerName = '';
  registerEmail = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.api.getUsers().subscribe(users => this.users = users);
  }

  loginAs(user: User): void {
    this.auth.login(user);
    this.router.navigate(['/dashboard']);
  }

  register(): void {
    if (!this.registerName || !this.registerEmail) return;
    this.api.createUser({ name: this.registerName, email: this.registerEmail }).subscribe(user => {
      this.users.push(user);
      this.auth.login(user);
      this.router.navigate(['/dashboard']);
    });
  }
}
