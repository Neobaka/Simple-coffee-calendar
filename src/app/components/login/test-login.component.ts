// src/app/components/test-login/test-login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-test-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-container">
      <!-- Декоративные элементы -->
      <div class="decoration top-right">
        <svg class="heart" width="26" height="29" viewBox="0 0 26 29" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.41241 13.7686C5.72173 7.7771 14.831 14.9895 15.1691 14.824C15.5072 14.6584 13.2617 2.36031 18.6475 2.00414C24.0333 1.64797 24.5746 26.8798 22.9878 26.7062C16.6007 26.0075 -0.896906 19.7601 2.41241 13.7686Z" stroke="#FF7022" stroke-opacity="0.5" stroke-width="4" stroke-linecap="round"/>
        </svg>


        <svg class="star"width="82" height="84" viewBox="0 0 82 84" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M56.233 37.7779C53.1974 34.3113 54.1263 2.48109 50.2757 4.05725C46.4252 5.63341 28.8582 23.6954 26.3956 22.6025C23.933 21.5096 4.39219 12.0152 4.64441 14.8823C4.89663 17.7495 16.8304 40.1693 15.2131 43.5844C13.5958 46.9995 1.87621 62.0108 4.33889 63.1038C6.80157 64.1968 27.9197 54.6983 31.153 56.3452C34.3863 57.9921 39.1973 81.0116 41.7145 79.6914C44.2317 78.3713 45.9219 60.1804 48.0411 58.1538C50.1603 56.1271 79.9493 49.9242 76.8073 48.5298C73.6653 47.1353 59.2686 41.2444 56.233 37.7779Z" stroke="#3F3932" stroke-width="8" stroke-linecap="round"/>
        </svg>

        <svg class="heart-small" width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.4182 2.26289C15.5521 4.42754 10.3443 10.7877 10.4541 11.0165C10.564 11.2452 19.2091 9.49908 19.3631 13.1812C19.5171 16.8633 1.85192 17.6616 2.00145 16.572C2.60334 12.1864 7.28423 0.0982386 11.4182 2.26289Z" stroke="#A9A9A9" stroke-width="4" stroke-linecap="round"/>
        </svg>

        <svg class="spiral" width="94" height="75" viewBox="0 0 94 75" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.00034 69.6798C5.00034 69.6798 5.3144 57.0634 14.1507 49.1456C23.1322 41.0977 40.6266 37.7279 45.7836 48.39C48.5577 54.1254 47.9163 59.5696 42.4139 63.0125C36.93 66.4438 31.1045 65.0322 26.6941 60.4595C17.2514 50.6695 26.4815 32.7134 38.1743 25.2907C49.8907 17.8531 70.4295 17.0248 75.1961 29.7936C77.4256 35.7656 76.4264 41.7274 70.8434 45.0377C65.3708 48.2824 59.3855 47.0528 55.1235 42.4847C46.0305 32.7385 53.6986 14.0085 65.7845 7.83391C73.6759 3.80225 80.9049 4.06778 88.3267 8.66192" stroke="#FF7022" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round"/>
        </svg>

      </div>

      <div class="decoration bottom-left">
        <svg class="leaf-small" width="69" height="83" viewBox="0 0 69 83" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M28.0389 67.5795C28.0389 67.5795 22.9331 73.7963 22.6345 78.5895" stroke="#FF7022" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round"/>
          <path d="M25.5246 62.7276C25.5246 62.7276 11.7467 63.9012 8.363 62.3649" stroke="#FF7022" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round"/>
          <path d="M35.9304 68.5152C35.9304 68.5152 35.9403 76.5688 37.4757 77.9922" stroke="#FF7022" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round"/>
          <path d="M40.4145 19.7306C40.4145 19.7306 37.5252 14.3121 44.6023 4.28971" stroke="#FF7022" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round"/>
          <path d="M45.4961 22.0806C45.4961 22.0806 53.6251 17.433 57.4929 17.0475" stroke="#FF7022" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round"/>
          <path d="M33.5481 21.6796C33.5481 21.6796 32.8431 17.1691 26.8357 14.3405" stroke="#FF7022" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round"/>
        </svg>

        <svg class="circle" width="78" height="79" viewBox="0 0 78 79" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M68.2351 51.8404C64.5881 57.6653 59.1878 62.0265 53.7396 64.7176C47.2249 67.9375 40.6961 68.9481 34.9251 68.6168C28.0663 68.1945 22.04 65.9659 17.2539 62.0816C13.0587 58.67 9.74729 53.9198 8.56758 47.758C7.61095 42.7305 8.1372 36.6003 11.3516 30.5023C14.4597 24.581 19.5283 19.7961 24.8885 16.7179C31.2201 13.0836 37.7304 11.6625 43.5072 11.621C50.4598 11.6245 56.663 13.416 61.7004 16.8752C66.2985 19.9881 70.012 24.5182 71.717 30.5158C73.0836 35.3477 73.1218 41.3815 70.4327 47.6564C69.8229 49.0724 69.0878 50.4732 68.241 51.833C67.9577 52.2943 68.861 52.5786 69.1621 52.0951C72.9268 46.0354 74.0798 39.6579 73.4773 34.3049C72.7491 27.8225 69.7098 22.7177 65.7444 18.9846C61.1082 14.6578 55.1636 11.9765 48.304 11.1181C42.3506 10.4155 35.5685 11.0651 28.6717 13.9732C23.0434 16.3436 17.242 20.3533 13.0037 26.1375C8.76539 31.9216 6.99554 38.3049 7.13882 43.8323C7.30968 50.4411 9.91824 55.7431 13.4713 59.7186C17.752 64.419 23.4055 67.5058 30.0491 68.7702C35.9682 69.9202 42.7225 69.6806 49.7649 67.224C55.4587 65.2347 61.5633 61.6258 66.2598 56.0683C67.3164 54.8159 68.2847 53.4897 69.1473 52.1136C69.4472 51.6413 68.5416 51.355 68.2351 51.8404Z" fill="#4A3AFF"/>
          <path d="M65.9162 60.8834C60.8195 67.2531 54.1475 71.3518 47.8019 73.2883C40.1016 75.6508 32.939 75.1923 26.8409 73.2232C19.7355 70.8919 13.8836 66.5519 9.67214 60.4901C5.96014 55.1636 3.49979 48.385 3.5354 40.4071C3.58739 33.9096 5.47167 26.4184 10.1227 19.6312C14.6484 13.0298 21.0641 8.35467 27.3716 5.90054C34.9083 2.9627 42.1427 2.91242 48.3013 4.382C55.6874 6.21165 61.8827 10.1016 66.4686 15.7892C70.5995 20.8602 73.5149 27.4063 74.0503 35.2505C74.4689 41.6375 73.2252 49.1419 69.0531 56.3003C68.1298 57.8873 67.0775 59.4247 65.9162 60.8834C65.4499 61.4662 66.2611 61.89 66.6739 61.374C71.9311 54.7795 74.5201 47.1825 75.0569 40.3423C75.6985 32.143 73.6273 25.073 70.3258 19.4235C66.4054 12.8091 60.7417 7.91188 53.7134 5.05942C47.5332 2.54967 40.1708 1.6147 32.1763 3.49216C25.691 5.01853 18.616 8.58772 12.8858 14.755C7.27497 20.7925 3.97591 28.3267 2.93585 35.1965C1.68932 43.4354 3.23294 50.7165 6.09001 56.5948C9.56585 63.5491 14.8269 68.857 21.5184 72.1608C27.549 75.1597 34.7641 76.6101 42.7749 75.3605C49.2781 74.3478 56.5332 71.3672 62.7674 65.5788C64.1526 64.2911 65.4582 62.8849 66.6597 61.387C67.1409 60.7856 66.3291 60.3675 65.9162 60.8834Z" fill="#4A3AFF"/>
          <path d="M65.9162 60.8834C60.8195 67.2531 54.1475 71.3518 47.8019 73.2883C40.1016 75.6508 32.939 75.1923 26.8409 73.2232C19.7355 70.8919 13.8836 66.5519 9.67214 60.4901C5.96014 55.1636 3.49979 48.385 3.5354 40.4071C3.58739 33.9096 5.47167 26.4184 10.1227 19.6311C14.6484 13.0298 21.0641 8.35467 27.3716 5.90054C34.9083 2.9627 42.1427 2.91242 48.3013 4.382C55.6874 6.21165 61.8827 10.1016 66.4686 15.7892C70.5995 20.8602 73.5149 27.4063 74.0503 35.2505C74.4689 41.6375 73.2252 49.1419 69.0531 56.3003C68.1298 57.8873 67.0775 59.4247 65.9162 60.8834ZM65.9162 60.8834C65.4499 61.4662 66.2611 61.89 66.6739 61.374C71.9311 54.7795 74.5201 47.1825 75.0569 40.3423C75.6985 32.143 73.6273 25.073 70.3258 19.4235C66.4054 12.8091 60.7417 7.91188 53.7134 5.05942C47.5332 2.54967 40.1708 1.6147 32.1763 3.49216C25.691 5.01853 18.616 8.58772 12.8858 14.755C7.27497 20.7925 3.97591 28.3267 2.93585 35.1965C1.68932 43.4354 3.23293 50.7165 6.09 56.5949C9.56586 63.5491 14.8269 68.857 21.5184 72.1608C27.549 75.1597 34.7641 76.6101 42.7749 75.3605C49.2781 74.3478 56.5332 71.3672 62.7674 65.5788C64.1526 64.2911 65.4582 62.8849 66.6597 61.387C67.1409 60.7856 66.3291 60.3675 65.9162 60.8834ZM68.2351 51.8404C64.5881 57.6653 59.1878 62.0265 53.7396 64.7176C47.2249 67.9375 40.6961 68.9481 34.9251 68.6168C28.0663 68.1945 22.04 65.9659 17.2539 62.0816C13.0587 58.67 9.74728 53.9198 8.56758 47.758C7.61095 42.7305 8.1372 36.6003 11.3516 30.5023C14.4597 24.581 19.5283 19.7961 24.8885 16.7179C31.2201 13.0836 37.7304 11.6625 43.5072 11.621C50.4598 11.6245 56.663 13.416 61.7004 16.8752C66.2985 19.9881 70.012 24.5182 71.717 30.5158C73.0836 35.3476 73.1218 41.3815 70.4327 47.6564C69.8229 49.0724 69.0878 50.4732 68.241 51.833C67.9577 52.2943 68.861 52.5786 69.1621 52.0951C72.9268 46.0354 74.0798 39.6579 73.4773 34.3049C72.7491 27.8225 69.7098 22.7177 65.7444 18.9846C61.1082 14.6578 55.1636 11.9765 48.304 11.1181C42.3506 10.4155 35.5685 11.0651 28.6717 13.9732C23.0434 16.3436 17.242 20.3533 13.0037 26.1375C8.76539 31.9216 6.99554 38.3049 7.13882 43.8323C7.30968 50.4411 9.91824 55.7431 13.4713 59.7186C17.752 64.419 23.4055 67.5058 30.0492 68.7702C35.9682 69.9202 42.7225 69.6806 49.7649 67.224C55.4587 65.2347 61.5633 61.6258 66.2598 56.0683C67.3164 54.8159 68.2847 53.4897 69.1473 52.1136C69.4472 51.6413 68.5416 51.355 68.2351 51.8404Z" stroke="#A9A9A9" stroke-width="5"/>
        </svg>

        <svg class="arrow" width="49" height="47" viewBox="0 0 49 47" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.5614 42.1503C9.10866 35.9412 23.7181 23.3061 24.3847 20.7394C25.0514 18.1728 2.8013 22.9129 4.05032 9.73313C5.29933 -3.44667 43.8739 9.84884 44.6282 12.5665C45.5712 15.9636 28.0141 48.3593 18.5614 42.1503Z" stroke="#3F3932" stroke-width="8" stroke-linecap="round"/>
        </svg>

        <svg class="leaf" width="86" height="79" viewBox="0 0 86 79" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30.2256 5.00009C20.2611 16.7426 1.38575 41.0638 5.60081 44.4084C10.8696 48.589 35.7922 29.3796 39.8474 22.9053C43.9027 16.4311 21.8301 60.0344 25.4667 71.2377C29.1033 82.441 52.3503 36.5869 53.1565 29.8493C53.9627 23.1116 65.4444 69.9052 76.44 73.4946C87.4356 77.084 77.2534 10.9253 55.2073 5.14952" stroke="#FF7022" stroke-opacity="0.5" stroke-width="10" stroke-linecap="round"/>
        </svg>

      </div>

      <div class="login-card">
        <!-- Логотип -->
        <div class="logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <rect width="40" height="40" fill="url(#pattern0_193_665)"/>
              <defs>
                <pattern id="pattern0_193_665" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlink:href="#image0_193_665" transform="translate(-0.0348837) scale(0.0116279)"/>
                </pattern>
                <image id="image0_193_665" width="92" height="86" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFwAAABWCAYAAABCdPE+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAQ6SURBVHhe7ZzdbxRVGId/eA3/FDf8FyZ6pf4Bpg0JQsKFHxUVokFQAqGLbWpjtx9QpRRlMVQLxbAkrU1T0022aW3ZmZ3ZnZmdr+NFKZr3QhI47/mYmefyOXdPdpPded85R4QQAhXKeIOKCl6q4IqpgiumCq6YKrhirAse/jFPlXREGiN6skC1FKwKnnXa8OojVEvHmx5But+iWgr2BM8zOKNDEGlMT6QyWLuP4LcfqJaGNcH9Hy8iaa9RLZXcfwZ37AOqpWJF8KTVRO+Xa1TLRQg4tWHkoUdPpGJ8cBH14dSGAeYnEL2fryH+6zHV0jE+uDt5Fpm7S7VUku0/4f90kWoWjA4ertxk+3l2iIhDONffB/KMHrFgbPDM3UW3/jHV0ulOfYSss001G2YGFzmc2jBE1KcnUomaiwgfzVHNipHBe4tXkLSaVEslc3fhTpyhmh3jgiftNfi3L1MtF5HDqQ1BDAJ6wo5RwUUcwhkdAkROj6TiL1xG0npKtRKMCu5NjyDrtKmWStJ6it6dK1Qrw5jg0WoDwfI01VIRgwBOjf8b9H8YETz399EdP021dNyJM+x/ol6G/uBCwLlxkv0ZRvBwBlFzkWrlaA/eb9QQb65QLZWssw2v/gnVWjiicy8l3dnA/vk3IbKEHmnn2Il3cfT421S/Nto+4SKNDwYKBsbmRFtwb/ZzpHtbVBceLcEH60sIHkxQXQqUB8/7DtyxU1SXBuXB3bFTyPsO1aVBafDgwfcYrC9RXSqUBU/3tuDNfkZ16VATXNFOiQ0oCe7Nf4l0Z4PqUsIePN5cQf/eKNWlhTV4Hnpwbpxk3ymxCdbg3fHTyP19qksNW/Dw4Syi1QbVpYcleNZpK9kpsRH5wUV+8BMwDulJBUdwf+Eb9rVim5EaPGk10bvzLdUV/0HqxCd8NIuUeU8v7/6NYLlOtXSOnXgPR4+/RfVrIzU4O0Lg2aV32GegKOKI7VXo3buuJDYn1gRPdzbgz39FtXVYEfxw4KxqaZ4TK4J7M+cKM3A2PvhgfQnB0iTV1mJ08CIOnI0OXsSBs7HB+7+OF3LgbGTwdG8L/twXVBcC44KLLCn0zqFxwf1bxR44GxU83lxBv1GjulAYE/zFwLngGBO8LANnI4IHy/XSDJy1B886bXjTn1JdWPQGP9w5LNHAWWtw//al0g2ctQVPWk307l6luvBoCf7vPVb6XsHWhZbg3akPtb+CrQvlwaMnCwgf819naipKg2fuLtzJs1SXCnXBn1/EyH2PlekoC967e5X9HisbUBL84B6rr6kuJezBX9xjVYCdEhmwB/dmzrHfY2UTrMGj1QaC36eoLjVswVXdY2UbbMFV3GNlIyzB+/e/s36tmAvpwdOdDfg3L1Bd8RypwYu+UyIDqcH9ufOFWSvmwq53fAqA1E94xcupgiumCq6YKrhiquCKqYIr5h/7OBGFuy7lhAAAAABJRU5ErkJggg=="/>
              </defs>
            </svg>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <input 
              type="email" 
              formControlName="email"
              class="form-control"
              placeholder="Email"
              [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
            />
            <div class="error-message" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              Введите корректный email
            </div>
          </div>

          <div class="form-group">
            <div class="password-wrapper">
              <input 
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                class="form-control"
                placeholder="Пароль"
                [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              />
              <button 
                type="button" 
                class="toggle-password"
                (click)="showPassword = !showPassword"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path *ngIf="!showPassword" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle *ngIf="!showPassword" cx="12" cy="12" r="3"/>
                  <path *ngIf="showPassword" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line *ngIf="showPassword" x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <div class="error-message" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              Введите пароль
            </div>
          </div>

          <div class="error-message-global" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="success-message" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <button 
            type="submit" 
            class="btn-submit"
            [disabled]="loginForm.invalid || isLoading"
          >
            {{ isLoading ? 'Загрузка...' : 'Войти' }}
          </button>

          <button 
            type="button"
            class="btn-admin" 
            (click)="loginAsAdmin()"
            [disabled]="isLoading"
          >
            (Test)
          </button>
        </form>

        <div class="footer">
          <a routerLink="/register">Создать аккаунт</a>
          <span class="divider">•</span>
          <a href="#">Забыли пароль?</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #F5F5F5;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .decoration {
      position: absolute;
      pointer-events: none;
    }

    .decoration.top-right {
      top: 25%;
      right: 34%;
      width: 300px;
      height: 300px;
    }

    .decoration.bottom-left {
      bottom: 22%;
      left: 31%;
      width: 300px;
      height: 300px;
    }

    .heart {
      position: absolute;
      top: 20px;
      right: 100px;
      animation: float 4s ease-in-out infinite;
    }

    .star {
      position: absolute;
      top: 60px;
      right: 40px;
      animation: float 5s ease-in-out infinite;
    }

    .heart-small {
      position: absolute;
      top: 105px;
      right: 10px;
      animation: float 5s ease-in-out infinite;
      animation-delay: 1s;
    }

    .spiral {
      position: absolute;
      top: 150px;
      right: 10px;
      animation: float 6s ease-in-out infinite;
    }

    .leaf-small {
      position: absolute;
      bottom: 150px;
      left: 10px;
      animation: sway 4s ease-in-out infinite;
    }

    .circle {
      position: absolute;
      bottom: 180px;
      left: 90px;
      animation: pulse 3s ease-in-out infinite;
    }

    .arrow {
      position: absolute;
      bottom: 110px;
      left: 100px;
      animation: float 5s ease-in-out infinite;
      animation-delay: 0.5s;
    }

    .leaf {
      position: absolute;
      bottom: 20px;
      left: 150px;
      animation: sway 5s ease-in-out infinite;
      animation-delay: 1s;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.1); opacity: 1; }
    }

    @keyframes sway {
      0%, 100% { transform: rotate(-5deg); }
      50% { transform: rotate(5deg); }
    }

    .login-card {
      background: white;
      padding: 50px 40px;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 380px;
      position: relative;
      z-index: 10;
    }

    .logo {
      display: flex;
      justify-content: center;
      margin-bottom: 40px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-control {
      width: 100%;
      padding: 15px 18px;
      border: 1px solid #E5E5E5;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.3s;
      background: #FAFAFA;
      color: #333;
    }

    .form-control::placeholder {
      color: #999;
    }

    .form-control:focus {
      outline: none;
      border-color: #FF8C42;
      background: white;
    }

    .form-control.error {
      border-color: #ff6b6b;
    }

    .password-wrapper {
      position: relative;
    }

    .toggle-password {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-password:hover {
      color: #666;
    }

    .error-message {
      color: #ff6b6b;
      font-size: 12px;
      margin-top: 5px;
      margin-left: 3px;
    }

    .error-message-global {
      color: #ff6b6b;
      font-size: 13px;
      padding: 12px;
      background: #fff5f5;
      border-radius: 8px;
      margin-bottom: 15px;
      text-align: center;
    }

    .success-message {
      color: #4CAF50;
      font-size: 13px;
      padding: 12px;
      background: #f1f8f4;
      border-radius: 8px;
      margin-bottom: 15px;
      text-align: center;
    }

    .btn-submit {
      width: 100%;
      padding: 15px;
      background: #3D3D3D;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 12px;
    }

    .btn-submit:hover:not(:disabled) {
      background: #2a2a2a;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-admin {
      width: 100%;
      padding: 13px;
      background: #F5F5F5;
      color: #666;
      border: 1px solid #E5E5E5;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-admin:hover:not(:disabled) {
      background: #EBEBEB;
      border-color: #D5D5D5;
    }

    .btn-admin:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 14px;
      color: #999;
    }

    .footer a {
      color: #666;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
    }

    .footer a:hover {
      color: #FF8C42;
    }

    .divider {
      margin: 0 10px;
      color: #ddd;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 40px 25px;
      }

      .decoration svg {
        transform: scale(0.7);
      }
    }
  `]
})
export class TestLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  loginAsAdmin(): void {
    this.loginForm.patchValue({
      email: 'admin@simplecoffee.ru',
      password: 'admin123'
    });
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.user) {
            const userName = response.data.user.fullName || response.data.user.email;
            this.successMessage = `Добро пожаловать, ${userName}!`;
          } else {
            this.successMessage = 'Вход выполнен успешно!';
          }
          
          setTimeout(() => {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigate([returnUrl]);
          }, 500);
        },
        error: (error) => {
          this.isLoading = false;
          
          if (error.status === 401) {
            this.errorMessage = 'Неверный email или пароль';
          } else if (error.status === 0) {
            this.errorMessage = 'Не удается подключиться к серверу';
          } else {
            this.errorMessage = error.error?.message || 'Ошибка входа';
          }
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}