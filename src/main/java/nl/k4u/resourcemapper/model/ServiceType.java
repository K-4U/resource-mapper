package nl.k4u.resourcemapper.model;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Enumeration of supported service types in the resource mapper.
 *
 * Each type represents a different category of infrastructure or application service
 * that can be defined and connected in the system.
 */
@Schema(description = "Type of infrastructure or application service")
public enum ServiceType {
    /** Valkey/Redis in-memory data store for caching and sessions */
    @Schema(description = "Valkey/Redis cache service")
    VALKEY,

    /** Elastic Container Service - containerized application runtime */
    @Schema(description = "AWS ECS containerized service")
    ECS,

    /** Amazon EC2 virtual server instance */
    @Schema(description = "Amazon EC2 instance")
    EC2,

    /** API Gateway for RESTful API management and routing */
    @Schema(description = "API Gateway service")
    API_GATEWAY,

    /** Application Load Balancer for HTTP/HTTPS traffic distribution */
    @Schema(description = "Application Load Balancer")
    ALB,

    /** Network Load Balancer for TCP/UDP traffic distribution */
    @Schema(description = "Network Load Balancer")
    NLB,

    /** Relational Database Service for managed database instances */
    @Schema(description = "AWS RDS database service")
    RDS,

    /** DNS service for domain name resolution and routing */
    @Schema(description = "DNS service (e.g., Route 53)")
    ROUTE53,

    /** AWS Lambda serverless compute service */
    @Schema(description = "AWS Lambda function")
    LAMBDA,

    /** Amazon S3 object storage service */
    @Schema(description = "Amazon S3 bucket")
    S3,

    /** Amazon SQS message queue service */
    @Schema(description = "Amazon SQS queue")
    SQS,

    /** Amazon SNS notification service */
    @Schema(description = "Amazon SNS topic")
    SNS,

    /** Amazon DynamoDB NoSQL database service */
    @Schema(description = "Amazon DynamoDB table")
    DYNAMODB,

    /** Amazon ElastiCache managed caching service */
    @Schema(description = "Amazon ElastiCache cluster")
    ELASTICACHE,

    /** Amazon CloudFront CDN service */
    @Schema(description = "Amazon CloudFront distribution")
    CLOUDFRONT,

    /** Amazon EventBridge event bus service */
    @Schema(description = "Amazon EventBridge event bus")
    EVENTBRIDGE,

    /** Amazon EventBridge rule for event routing and filtering */
    @Schema(description = "Amazon EventBridge rule")
    EVENTBRIDGE_RULE,

    /** Amazon Kinesis data streaming service */
    @Schema(description = "Amazon Kinesis stream")
    KINESIS,

    /** AWS Step Functions state machine orchestration */
    @Schema(description = "AWS Step Functions state machine")
    STEP_FUNCTIONS,

    /** Amazon EKS Kubernetes cluster service */
    @Schema(description = "Amazon EKS cluster")
    EKS,

    /** Amazon ECR container registry */
    @Schema(description = "Amazon ECR repository")
    ECR,

    /** AWS Secrets Manager for secrets storage */
    @Schema(description = "AWS Secrets Manager")
    SECRETS_MANAGER,

    /** Amazon Cognito user authentication service */
    @Schema(description = "Amazon Cognito user pool")
    COGNITO
}
