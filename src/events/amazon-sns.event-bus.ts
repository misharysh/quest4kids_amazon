import { Injectable } from "@nestjs/common";
import { IRemoteEventBus } from "./remote.event-bus";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Event } from "./event";

@Injectable()
export class AmazonSnsEventBus implements IRemoteEventBus {
    
    private sns = new SNSClient({
        region: 'us-east-1',
        credentials: {
            accessKeyId: process.env.AMAZON_ACCESS_KEY_ID ?? '',
            secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY ?? '',
        },
    });

    async raise<TEvent extends Event>(event: TEvent): Promise<void> {
        const topicArn = process.env.AWS_SNS_TOPIC_ARN;

        await this.sns.send(
            new PublishCommand({
                TopicArn: topicArn,
                Message: JSON.stringify(event),
                MessageAttributes: {
                    type: { DataType: 'String', StringValue: event.type },
                    traceId: { DataType: 'String', StringValue: event.traceId },
                    correlationId: { DataType: 'String', StringValue: event.correlationId },
                    eventId: { DataType: 'String', StringValue: event.eventId },
                },
            }),
        );
    }
}