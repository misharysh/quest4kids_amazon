import 'reflect-metadata';

process.env.NODE_ENV = 'test';

jest.mock('src/users/cqrs/handlers/get-avatar.handler', () => ({
  GetAvatarHandler: class {},
}));

jest.mock('src/aws/aws.service', () => ({
  AwsService: class {
    getSignedUrl() {
      return 'http://stub-url';
    }
    uploadFile() {
      return { key: 'stub-key' };
    }
    deleteFile() {
      return true;
    }
  },
}));
