import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { GenerateTaskCommand } from "../commands/generate-task.command";
import { Task } from "src/tasks/task.entity";
import { TaskLabelEnum } from "src/tasks/task-label.enum";
import OpenAI from "openai";
import { BadRequestException } from "@nestjs/common";

@CommandHandler(GenerateTaskCommand)
export class GenerateTaskHandler
    implements ICommandHandler<GenerateTaskCommand, Task>
{
    private openai = new OpenAI({
        apiKey: process.env.OPEN_AI_KEY,
    });

    async execute(command: GenerateTaskCommand): Promise<Task> {
        const prompt = command.generateTaskDto.prompt;
        
        const allowedLabels = Object.values(TaskLabelEnum);
    
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
            {
                role: 'system',
                content: `
                You are an assistant that converts user task descriptions into JSON with fields:
                - title: take from ${prompt},
                - description: detailed task description (create if short or vague),
                - points: an estimated number of points (an integer 5 or 8 or 10 or 15),
                - status: always set to "OPEN",
                - labels: an array with at least one label from the allowed list below.

                Allowed labels: ${allowedLabels.join(', ')}.

                If the input is completely empty, nonsensical, or insufficient to create a task, respond with JSON:
                { "error": error which field you are not satisfied with and what you need to do }.

                Otherwise, always create a meaningful JSON task, even if the input is very short or vague.
                `,
            },
            {
                role: 'user',
                content: `Create a task from this: "${prompt}".
                        Use only these labels: ${allowedLabels.join(', ')}.
                        Respond strictly in JSON format.`,
            },
            ],
            temperature: 0.7,
        });

        try {
            const rawText = completion.choices[0].message.content;
            if (rawText === null) {
                throw new Error('OpenAI вернул null вместо строки');
            }

            return JSON.parse(rawText);
        } catch (e) {
            throw new BadRequestException({
                message: 'Error of parsing from OpenAI',
                raw: completion.choices[0].message.content,
            });
        }
    }
}