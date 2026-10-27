import type { HttpContext } from '@adonisjs/core/http'

export default class WebhooksController {


    // Endpoint para receber webhooks (ex: WAPI)
    async receive({ request }: HttpContext) {
        const payload = request.all();

        // Processar o payload conforme necessário
        console.log('Webhook recebido:', payload);

        return { success: true };
    }       

}