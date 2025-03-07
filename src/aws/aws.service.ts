import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { AmazonConfig } from './../config/amazon.config';

@Injectable()
export class AwsService {
    private s3: AWS.S3;

    constructor(
        private readonly configService: ConfigService
    ) 
    {
        this.s3 = new AWS.S3({
            accessKeyId: configService.get<AmazonConfig>('amazon')?.accessKeyId,
            secretAccessKey: configService.get<AmazonConfig>('amazon')?.secretAccessKey
        });
    };

    public async s3_upload(file, name, mimeType)
    {
        const bucket = this.configService.get<AmazonConfig>('amazon')?.bucket;

        if (bucket)
        {
            const params = {
                Bucket: bucket,
                Key: new Date().getTime() + '_' + String(name),
                Body: file,
                //ACL: 'public-read',
                ContentType: mimeType,
                ContentDisposition: 'inline',
                CreateBucketConfiguration: {
                    LocationConstraint: 'ap-south-1',
                },
            };
            
            try
            {
                let s3Repsonse = await this.s3.upload(params).promise();
                
                return s3Repsonse;
            }
            catch(e)
            {
                throw new InternalServerErrorException('Error during uploading of avatar to S3');
            }
        }
        else
        {
            throw new BadRequestException();
        }
    };

    public async s3_get(key:string): Promise<string>
    {
        const bucket = this.configService.get<AmazonConfig>('amazon')?.bucket;

        try
        {
            const url = await this.s3.getSignedUrlPromise('getObject', {
                Bucket: bucket,
                Key: key,
                Expires: 60 * 60 * 24 //one day
            });
    
            return url;
        }
        catch(e)
        {
            throw new InternalServerErrorException('Error during getting of avatar from S3');
        }
    };

    public async s3_delete(key: string): Promise<void>
    {
        try
        {
            const bucket = this.configService.get<AmazonConfig>('amazon')?.bucket;

            if (bucket)
            {
                await this.s3.deleteObject({
                    Bucket: bucket,
                    Key: key
                }).promise();
            }
        }
        catch(e)
        {
            throw new InternalServerErrorException('Error during deleting of avatar from S3');
        }
    };
}