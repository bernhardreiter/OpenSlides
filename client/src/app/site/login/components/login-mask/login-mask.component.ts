import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AuthService } from 'app/core/core-services/auth.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { LoginDataService } from 'app/core/ui-services/login-data.service';
import { OverlayService } from 'app/core/ui-services/overlay.service';
import { ParentErrorStateMatcher } from 'app/shared/parent-error-state-matcher';
import { BaseViewComponent } from 'app/site/base/base-view';

/**
 * Login mask component.
 *
 * Handles user and guest login
 */
@Component({
    selector: 'os-login-mask',
    templateUrl: './login-mask.component.html',
    styleUrls: ['./login-mask.component.scss']
})
export class LoginMaskComponent extends BaseViewComponent implements OnInit, OnDestroy {
    /**
     * Show or hide password and change the indicator accordingly
     */
    public hide: boolean;

    /**
     * Reference to the SnackBarEntry for the installation notice send by the server.
     */
    public installationNotice: string;

    /**
     * Login Error Message if any
     */
    public loginErrorMsg = '';

    /**
     * Form group for the login form
     */
    public loginForm: FormGroup;

    /**
     * Custom Form validation
     */
    public parentErrorStateMatcher = new ParentErrorStateMatcher();

    public operatorSubscription: Subscription | null;

    /**
     * The message, that should appear, when the user logs in.
     */
    private loginMessage = 'Loading data. Please wait...';

    /**
     * Constructor for the login component
     *
     * @param authService Authenticating the user
     * @param operator The representation of the current user
     * @param router forward to start page
     * @param formBuilder To build the form and validate
     * @param httpService used to get information before the login
     * @param OpenSlides The Service for OpenSlides
     * @param loginDataService provide information about the legal notice and privacy policy
     * @param overlayService Service to show the spinner when the user is signing in
     */
    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private authService: AuthService,
        private operator: OperatorService,
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        private loginDataService: LoginDataService,
        private overlayService: OverlayService
    ) {
        super(title, translate, matSnackBar);
        // Hide the spinner if the user is at `login-mask`
        this.createForm();
    }

    /**
     * Init.
     *
     * Set the title to "Log In"
     * Observes the operator, if a user was already logged in, recreate to user and skip the login
     */
    public ngOnInit(): void {
        this.subscriptions.push(
            this.loginDataService.loginInfoText.subscribe(notice => (this.installationNotice = notice))
        );

        // Maybe the operator changes and the user is logged in. If so, redirect him and boot OpenSlides.
        this.operatorSubscription = this.operator.getUserObservable().subscribe(user => {
            if (user) {
                this.clearOperatorSubscription();
                this.authService.redirectUser(user.id);
            }
        });
    }

    /**
     * Clear the subscription on destroy.
     */
    public ngOnDestroy(): void {
        this.clearOperatorSubscription();
    }

    /**
     * Clears the subscription to the operator.
     */
    private clearOperatorSubscription(): void {
        if (this.operatorSubscription) {
            this.operatorSubscription.unsubscribe();
            this.operatorSubscription = null;
        }
    }

    /**
     * Create the login Form
     */
    public createForm(): void {
        this.loginForm = this.formBuilder.group({
            username: ['', [Validators.required, Validators.maxLength(128)]],
            password: ['', [Validators.required, Validators.maxLength(128)]]
        });
    }

    /**
     * Actual login function triggered by the form.
     *
     * Send username and password to the {@link AuthService}
     */
    public async formLogin(): Promise<void> {
        this.loginErrorMsg = '';
        try {
            this.overlayService.showSpinner(this.translate.instant(this.loginMessage), true);
            await this.authService.login(this.loginForm.value.username, this.loginForm.value.password, () => {
                this.clearOperatorSubscription(); // We take control, not the subscription.
            });
        } catch (e) {
            this.overlayService.hideSpinner();
            this.loginForm.setErrors({
                notFound: true
            });
            this.loginErrorMsg = e;
        }
    }

    /**
     * Go to the reset password view
     */
    public resetPassword(): void {
        this.router.navigate(['./reset-password'], { relativeTo: this.route });
    }

    /**
     * returns if the anonymous is enabled.
     */
    public areGuestsEnabled(): boolean {
        return this.operator.guestsEnabled;
    }

    /**
     * Guests (if enabled) can navigate directly to the main page.
     */
    public guestLogin(): void {
        this.overlayService.showSpinner(this.translate.instant(this.loginMessage));
        this.authService.guestLogin();
    }
}
