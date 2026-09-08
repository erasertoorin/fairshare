import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Ein unbekannter Fehler ist aufgetreten';

      if (error.status === 0) {
        message = 'Server nicht erreichbar. Ist das Backend gestartet?';
      } else if (error.status === 401) {
        message = 'Nicht eingeloggt';
      } else if (error.status === 403) {
        message = 'Keine Berechtigung für diese Aktion';
      } else if (error.status === 404) {
        message = 'Nicht gefunden';
      } else if (error.error?.error) {
        message = error.error.error;
      }

      snackBar.open(message, 'OK', { duration: 4000 });
      return throwError(() => error);
    })
  );
};
