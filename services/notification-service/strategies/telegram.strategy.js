// Telegram Notification Strategy
// Demonstrates: Strategy Pattern Implementation

const axios = require('axios');

class TelegramNotificationStrategy {
    constructor(botToken) {
        this.botToken = botToken;
        this.apiUrl = `https://api.telegram.org/bot${botToken}`;
    }

    async send(recipient, message, options = {}) {
        try {
            // Recipient can be telegram_id or chat_id
            const chatId = recipient;
            
            // Format message with Markdown
            const formattedMessage = this.formatMessage(message);
            
            // Prepare keyboard if provided
            const keyboard = options.keyboard || this.getDefaultKeyboard(options.template);
            
            // Send message via Telegram Bot API
            const response = await axios.post(`${this.apiUrl}/sendMessage`, {
                chat_id: chatId,
                text: formattedMessage,
                parse_mode: 'Markdown',
                reply_markup: keyboard ? JSON.stringify(keyboard) : undefined
            });
            
            if (response.data.ok) {
                return {
                    success: true,
                    message_id: response.data.result.message_id,
                    channel: 'telegram',
                    recipient: chatId,
                    sent_at: new Date().toISOString()
                };
            } else {
                throw new Error(response.data.description || 'Failed to send message');
            }
        } catch (error) {
            console.error('Telegram notification error:', error);
            return {
                success: false,
                channel: 'telegram',
                recipient,
                error: error.message,
                failed_at: new Date().toISOString()
            };
        }
    }

    formatMessage(message) {
        // Add formatting for better readability
        if (typeof message === 'string') {
            return message;
        }
        
        let formatted = '';
        
        if (message.title) {
            formatted += `*${message.title}*\n\n`;
        }
        
        if (message.body) {
            formatted += message.body;
        }
        
        if (message.fields) {
            formatted += '\n\n';
            for (const [key, value] of Object.entries(message.fields)) {
                formatted += `*${this.humanize(key)}:* ${value}\n`;
            }
        }
        
        if (message.footer) {
            formatted += `\n_${message.footer}_`;
        }
        
        return formatted;
    }

    humanize(str) {
        return str
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    getDefaultKeyboard(template) {
        // Return appropriate keyboard based on template
        switch (template) {
            case 'appointment_confirmation':
                return {
                    inline_keyboard: [
                        [
                            { text: '✅ Confirmar', callback_data: 'confirm_appointment' },
                            { text: '❌ Cancelar', callback_data: 'cancel_appointment' }
                        ],
                        [
                            { text: '📋 Ver Detalles', callback_data: 'view_appointment' }
                        ]
                    ]
                };
            
            case 'appointment_reminder':
                return {
                    inline_keyboard: [
                        [
                            { text: '✅ Confirmar Asistencia', callback_data: 'confirm_attendance' },
                            { text: '❌ No Podré Asistir', callback_data: 'cancel_appointment' }
                        ]
                    ]
                };
            
            default:
                return null;
        }
    }

    async sendBulk(recipients, message, options = {}) {
        const results = [];
        
        // Send to each recipient
        for (const recipient of recipients) {
            const result = await this.send(recipient, message, options);
            results.push(result);
            
            // Add small delay to avoid rate limiting
            await this.delay(100);
        }
        
        return results;
    }

    async sendWithPhoto(recipient, message, photoUrl, options = {}) {
        try {
            const response = await axios.post(`${this.apiUrl}/sendPhoto`, {
                chat_id: recipient,
                photo: photoUrl,
                caption: this.formatMessage(message),
                parse_mode: 'Markdown',
                reply_markup: options.keyboard ? JSON.stringify(options.keyboard) : undefined
            });
            
            return {
                success: response.data.ok,
                message_id: response.data.result?.message_id,
                channel: 'telegram',
                recipient
            };
        } catch (error) {
            console.error('Telegram photo notification error:', error);
            return {
                success: false,
                channel: 'telegram',
                recipient,
                error: error.message
            };
        }
    }

    async sendDocument(recipient, documentUrl, caption, options = {}) {
        try {
            const response = await axios.post(`${this.apiUrl}/sendDocument`, {
                chat_id: recipient,
                document: documentUrl,
                caption: caption,
                parse_mode: 'Markdown'
            });
            
            return {
                success: response.data.ok,
                message_id: response.data.result?.message_id,
                channel: 'telegram',
                recipient
            };
        } catch (error) {
            console.error('Telegram document notification error:', error);
            return {
                success: false,
                channel: 'telegram',
                recipient,
                error: error.message
            };
        }
    }

    async sendLocation(recipient, latitude, longitude, title = '') {
        try {
            const response = await axios.post(`${this.apiUrl}/sendLocation`, {
                chat_id: recipient,
                latitude,
                longitude,
                title
            });
            
            return {
                success: response.data.ok,
                message_id: response.data.result?.message_id,
                channel: 'telegram',
                recipient
            };
        } catch (error) {
            console.error('Telegram location notification error:', error);
            return {
                success: false,
                channel: 'telegram',
                recipient,
                error: error.message
            };
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    validateRecipient(recipient) {
        // Telegram chat IDs are numbers (can be negative for groups)
        return /^-?\d+$/.test(recipient);
    }

    async getUpdates() {
        try {
            const response = await axios.get(`${this.apiUrl}/getUpdates`);
            return response.data.result;
        } catch (error) {
            console.error('Error getting updates:', error);
            return [];
        }
    }

    async setWebhook(url) {
        try {
            const response = await axios.post(`${this.apiUrl}/setWebhook`, {
                url
            });
            return response.data.ok;
        } catch (error) {
            console.error('Error setting webhook:', error);
            return false;
        }
    }
}

module.exports = { TelegramNotificationStrategy };
