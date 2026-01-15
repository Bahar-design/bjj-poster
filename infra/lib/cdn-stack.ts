import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/types';

export class CdnStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    posterBucket: s3.Bucket,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // Only create CloudFront in production
    if (config.stage !== 'prod') {
      return;
    }

    // Certificate for custom domain (must be in us-east-1)
    // NOTE: You'll need to manually create this in ACM first
    // const certificate = acm.Certificate.fromCertificateArn(
    //   this,
    //   'Certificate',
    //   'arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID'
    // );

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `BJJ Poster App CDN (${config.stage})`,
      defaultBehavior: {
        origin: new origins.S3Origin(posterBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true
      },
      // Uncomment when you have a certificate:
      // domainNames: [config.webDomain],
      // certificate: certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
      enableLogging: true,
      logBucket: posterBucket,
      logFilePrefix: 'cloudfront-logs/',
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      exportName: `${config.stage}-DistributionDomainName`
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      exportName: `${config.stage}-DistributionId`
    });
  }
}
