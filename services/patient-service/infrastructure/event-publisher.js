// Event Publisher for Patient Service
// Demonstrates: Observer Pattern, Event-Driven Architecture

const axios = require('axios');

class EventPublisher {
    constructor() {
        this.webhooks = process.env.EVENT_WEBHOOKS ? 
            process.env.EVENT_WEBHOOKS.split(',') : [];
        this.internalHandlers = new Map();
    }

    // Register internal event handlers
    on(eventType, handler) {
        if (!this.internalHandlers.has(eventType)) {
            this.internalHandlers.set(eventType, []);
        }
        this.internalHandlers.get(eventType).push(handler);
    }

    // Publish event
    async publish(eventType, data) {
        const event = {
            id: this.generateEventId(),
            type: eventType,
            data: data,
            timestamp: new Date().toISOString(),
            service: 'patient-service'
        };

        // Handle internal subscribers
        await this.notifyInternalHandlers(event);
        
        // Send to external webhooks
        await this.sendToWebhooks(event);
        
        // Log event
        console.log(`Event published: ${eventType}`, event);
    }

    async notifyInternalHandlers(event) {
        const handlers = this.internalHandlers.get(event.type) || [];
        
        for (const handler of handlers) {
            try {
                await handler(event);
            } catch (error) {
                console.error(`Error in event handler for ${event.type}:`, error);
            }
        }
    }

    async sendToWebhooks(event) {
        const promises = this.webhooks.map(url => 
            this.sendToWebhook(url, event).catch(err => {
                console.error(`Failed to send event to ${url}:`, err);
            })
        );
        
        await Promise.all(promises);
    }

    async sendToWebhook(url, event) {
        try {
            await axios.post(url, event, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Event-Type': event.type,
                    'X-Event-Id': event.id
                },
                timeout: 5000
            });
        } catch (error) {
            // Log but don't throw - webhooks shouldn't break the main flow
            console.error(`Webhook error for ${url}:`, error.message);
        }
    }

    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = { EventPublisher };
