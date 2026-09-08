import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<User | null>(this.loadUser());

  readonly currentUser = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.userSignal() !== null);

  currentUserId(): string | null {
    return this.userSignal()?.id ?? null;
  }

  login(user: User): void {
    this.userSignal.set(user);
    localStorage.setItem('fairshare_user', JSON.stringify(user));
  }

  logout(): void {
    this.userSignal.set(null);
    localStorage.removeItem('fairshare_user');
  }

  private loadUser(): User | null {
    const stored = localStorage.getItem('fairshare_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}
