// utils/tourSteps.ts
import { TourStep } from "../types";

export const TOUR_STEPS: TourStep[] = [
    {
        element: '#tour-sidebar',
        intro: 'به صرافی سبز خوش آمدید! این منوی اصلی شماست که از طریق آن به تمام بخش‌ها دسترسی دارید.'
    },
    {
        element: '#tour-dashboard-link',
        intro: 'داشبورد، نمای کلی و خلاصه‌ای زنده از وضعیت کسب‌وکار شما را نمایش می‌دهد.'
    },
    {
        element: '#tour-transactions-link',
        intro: 'از این بخش برای ثبت، ویرایش و مشاهده تمام تراکنش‌های ارزی و کالایی استفاده کنید.'
    },
    {
        element: '#tour-tasks-link',
        intro: 'در این بخش می‌توانید کارها را مدیریت کرده، به دیگران تخصیص دهید و وضعیت پیشرفت آن‌ها را پیگیری کنید.'
    },
    {
        element: '#tour-notifications-button',
        intro: 'از اینجا می‌توانید اعلان‌های مربوط به کارهای جدید یا سررسیدهای نزدیک را مشاهده کنید.'
    },
    {
        element: '#tour-theme-button',
        intro: 'با کلیک بر روی این دکمه می‌توانید بین تم روشن و تاریک جابجا شوید.'
    },
    {
        element: '#tour-help-button',
        intro: 'هر زمان که نیاز به راهنمایی داشتید، می‌توانید با کلیک بر روی این دکمه، این راهنما را مجدداً مشاهده کنید.'
    },
    {
        element: '#tour-logout-button',
        intro: 'برای خروج امن از حساب کاربری خود، از این دکمه استفاده کنید. موفق باشید!'
    }
];
