import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  /**
   * Register a new user with email and password
   * Also saves user's name to Firestore
   */
  register(user: { name: string; email: string; password: string }): Observable<any> {
    return from(
      createUserWithEmailAndPassword(this.auth, user.email, user.password)
        .then(async (userCredential: UserCredential) => {
          // Save user's name to Firestore
          const userDocRef = doc(this.firestore, 'users', userCredential.user.uid);
          await setDoc(userDocRef, {
            name: user.name,
            email: user.email,
            password: user.password,
            createdAt: new Date().toISOString()
          });
          
          return {
            message: 'Registration successful',
            user: {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: user.name
            }
          };
        })
    ).pipe(
      catchError((error) => {
        let errorMessage = 'Registration failed. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        }
        return throwError(() => ({ message: errorMessage }));
      })
    );
  }

  /**
   * Login with email and password
   * Also fetches user's name from Firestore
   */
  login(credentials: { email: string; password: string }): Observable<any> {
    return from(
      signInWithEmailAndPassword(this.auth, credentials.email, credentials.password)
        .then(async (userCredential: UserCredential) => {
          // Fetch user's name from Firestore
          const userDocRef = doc(this.firestore, 'users', userCredential.user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data();
          
          return {
            message: 'Login successful',
            user: {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: userData?.['name'] || ''
            }
          };
        })
    ).pipe(
      catchError((error) => {
        let errorMessage = 'Login failed. Please try again.';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid credentials. Please try again.';
        }
        return throwError(() => ({ message: errorMessage, status: 401 }));
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      catchError((error) => {
        return throwError(() => ({ message: 'Logout failed. Please try again.' }));
      })
    );
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Get current user as Observable
   */
  getCurrentUserObservable(): Observable<User | null> {
    return new Observable((observer) => {
      this.auth.onAuthStateChanged((user) => {
        observer.next(user);
      });
    });
  }
}
