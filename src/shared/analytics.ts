declare const gtag: Function;

export type EventNames = 'main_menu' | 'grid' | 'memory' | 'zombie' | 'high-score' | 'general';
export type LabelType = 'load' | 'click' | 'method' | 'win' | 'loss' | 'keyboard' | 'game-over';

export class Analytics {
    static onEvent(event: { action: EventNames, category: 'engagement' | 'reset' | 'bounce' | 'event', label: LabelType }, data?: any) {
        if (!!gtag) {
            gtag('event', event.action, {
                'event_category': event.category,
                'event_label': event.label,
                'data': data
            });
        }
    }

    static onGameChange(gameId: string) {
        if (!!gtag) {
            gtag('event', 'screen_view', {
                'app_name': 'GRID',
                'screen_name': gameId
            });

            Analytics.onEvent({
                action: 'general',
                category: 'engagement',
                label: 'load'
            }, gameId);
        }
    }
}