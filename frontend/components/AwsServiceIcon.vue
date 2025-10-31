<template>
  <img 
    v-if="iconPath" 
    :src="iconPath" 
    :alt="serviceType"
    class="aws-service-icon"
    @error="handleError"
  />
  <div v-else class="aws-service-icon-fallback">
    {{ serviceType }}
  </div>
</template>

<script setup lang="ts">
import { ServiceType } from '~/types'

interface Props {
  serviceType: ServiceType
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 48
})

const iconError = ref(false)

const handleError = () => {
  iconError.value = true
  console.warn(`Failed to load icon for ${props.serviceType}`)
}

// Map ServiceType enum values to AWS icon paths (relative to assets/icons/aws/)
// Supports aliases - multiple ServiceTypes can map to the same icon
const SERVICE_TYPE_TO_ICON: Record<ServiceType, string> = {
  // Compute
  [ServiceType.EC2]: 'Compute/EC2.svg',
  [ServiceType.ECS]: 'Containers/Elastic-Container-Service.svg',
  [ServiceType.EKS]: 'Containers/Elastic-Kubernetes-Service.svg',
  [ServiceType.LAMBDA]: 'Compute/Lambda.svg',
  [ServiceType.FARGATE]: 'Compute/Fargate.svg',
  [ServiceType.BATCH]: 'Compute/Batch.svg',
  [ServiceType.ELASTIC_BEANSTALK]: 'Compute/Elastic-Beanstalk.svg',
  [ServiceType.APP_RUNNER]: 'Containers/App-Runner.svg',
  
  // Containers
  [ServiceType.ECR]: 'Containers/Elastic-Container-Registry.svg',
  [ServiceType.ECS_ANYWHERE]: 'Containers/ECS-Anywhere.svg',
  [ServiceType.EKS_ANYWHERE]: 'Containers/EKS-Anywhere.svg',
  
  // Storage
  [ServiceType.S3]: 'Storage/Simple-Storage-Service.svg',
  [ServiceType.EFS]: 'Storage/EFS.svg',
  [ServiceType.EBS]: 'Storage/Elastic-Block-Store.svg',
  [ServiceType.FSX]: 'Storage/FSx.svg',
  [ServiceType.STORAGE_GATEWAY]: 'Storage/Storage-Gateway.svg',
  [ServiceType.BACKUP]: 'Storage/Backup.svg',
  [ServiceType.S3_GLACIER]: 'Storage/Simple-Storage-Service-Glacier.svg',
  
  // Database - with aliases
  [ServiceType.RDS]: 'Database/RDS.svg',
  [ServiceType.DYNAMODB]: 'Database/DynamoDB.svg',
  [ServiceType.ELASTICACHE]: 'Database/ElastiCache.svg',
  [ServiceType.VALKEY]: 'Database/ElastiCache.svg', // Alias - same as ElastiCache
  [ServiceType.AURORA]: 'Database/Aurora.svg',
  [ServiceType.NEPTUNE]: 'Database/Neptune.svg',
  [ServiceType.DOCUMENTDB]: 'Database/DocumentDB.svg',
  [ServiceType.KEYSPACES]: 'Database/Keyspaces.svg',
  [ServiceType.TIMESTREAM]: 'Database/Timestream.svg',
  [ServiceType.MEMORYDB]: 'Database/MemoryDB-for-Redis.svg',
  [ServiceType.QLDB]: 'Database/Quantum-Ledger-Database.svg',
  
  // Networking & Content Delivery
  [ServiceType.VPC]: 'Networking-Content-Delivery/Virtual-Private-Cloud.svg',
  [ServiceType.CLOUDFRONT]: 'Networking-Content-Delivery/CloudFront.svg',
  [ServiceType.ROUTE53]: 'Networking-Content-Delivery/Route-53.svg',
  [ServiceType.API_GATEWAY]: 'App-Integration/API-Gateway.svg',
  [ServiceType.DIRECT_CONNECT]: 'Networking-Content-Delivery/Direct-Connect.svg',
  [ServiceType.APP_MESH]: 'Networking-Content-Delivery/App-Mesh.svg',
  [ServiceType.CLOUD_MAP]: 'Networking-Content-Delivery/Cloud-Map.svg',
  [ServiceType.GLOBAL_ACCELERATOR]: 'Networking-Content-Delivery/Global-Accelerator.svg',
  
  // Load Balancers - with aliases (all map to same icon)
  [ServiceType.ALB]: 'Networking-Content-Delivery/Elastic-Load-Balancing.svg', // Alias
  [ServiceType.NLB]: 'Networking-Content-Delivery/Elastic-Load-Balancing.svg', // Alias
  [ServiceType.ELB]: 'Networking-Content-Delivery/Elastic-Load-Balancing.svg', // Alias
  [ServiceType.ELASTIC_LOAD_BALANCING]: 'Networking-Content-Delivery/Elastic-Load-Balancing.svg',
  
  // Messaging & Integration
  [ServiceType.SQS]: 'App-Integration/Simple-Queue-Service.svg',
  [ServiceType.SNS]: 'App-Integration/Simple-Notification-Service.svg',
  [ServiceType.EVENTBRIDGE]: 'App-Integration/EventBridge.svg',
  [ServiceType.EVENTBRIDGE_RULE]: 'App-Integration/EventBridge.svg', // Alias
  [ServiceType.STEP_FUNCTIONS]: 'App-Integration/Step-Functions.svg',
  [ServiceType.SWF]: 'App-Integration/Step-Functions.svg', // Using Step Functions icon as fallback
  [ServiceType.MQ]: 'App-Integration/MQ.svg',
  [ServiceType.APPSYNC]: 'Front-End-Web-Mobile/AppSync.svg',
  
  // Analytics
  [ServiceType.KINESIS]: 'Analytics/Kinesis.svg',
  [ServiceType.KINESIS_FIREHOSE]: 'Analytics/Kinesis-Firehose.svg',
  [ServiceType.KINESIS_ANALYTICS]: 'Analytics/Kinesis-Data-Analytics.svg',
  [ServiceType.ATHENA]: 'Analytics/Athena.svg',
  [ServiceType.EMR]: 'Analytics/EMR.svg',
  [ServiceType.GLUE]: 'Analytics/Glue.svg',
  [ServiceType.REDSHIFT]: 'Analytics/Redshift.svg',
  [ServiceType.QUICKSIGHT]: 'Analytics/QuickSight.svg',
  [ServiceType.OPENSEARCH]: 'Analytics/OpenSearch-Service.svg',
  [ServiceType.MSK]: 'Analytics/Managed-Streaming-for-Apache-Kafka.svg',
  
  // Security & Identity
  [ServiceType.IAM]: 'Security-Identity-Compliance/Identity-and-Access-Management.svg',
  [ServiceType.COGNITO]: 'Security-Identity-Compliance/Cognito.svg',
  [ServiceType.SECRETS_MANAGER]: 'Security-Identity-Compliance/Secrets-Manager.svg',
  [ServiceType.KMS]: 'Security-Identity-Compliance/Key-Management-Service.svg',
  [ServiceType.WAF]: 'Security-Identity-Compliance/WAF.svg',
  [ServiceType.SHIELD]: 'Security-Identity-Compliance/Shield.svg',
  [ServiceType.GUARDDUTY]: 'Security-Identity-Compliance/GuardDuty.svg',
  [ServiceType.INSPECTOR]: 'Security-Identity-Compliance/Inspector.svg',
  [ServiceType.MACIE]: 'Security-Identity-Compliance/Macie.svg',
  [ServiceType.SECURITY_HUB]: 'Security-Identity-Compliance/Security-Hub.svg',
  [ServiceType.CERTIFICATE_MANAGER]: 'Security-Identity-Compliance/Certificate-Manager.svg',
  [ServiceType.FIREWALL_MANAGER]: 'Security-Identity-Compliance/Firewall-Manager.svg',
  [ServiceType.NETWORK_FIREWALL]: 'Security-Identity-Compliance/Network-Firewall.svg',
  
  // Management & Governance
  [ServiceType.CLOUDWATCH]: 'Management-Governance/CloudWatch.svg',
  [ServiceType.CLOUDTRAIL]: 'Management-Governance/CloudTrail.svg',
  [ServiceType.CONFIG]: 'Management-Governance/Config.svg',
  [ServiceType.SYSTEMS_MANAGER]: 'Management-Governance/Systems-Manager.svg',
  [ServiceType.CLOUDFORMATION]: 'Management-Governance/CloudFormation.svg',
  [ServiceType.ORGANIZATIONS]: 'Management-Governance/Organizations.svg',
  [ServiceType.CONTROL_TOWER]: 'Management-Governance/Control-Tower.svg',
  [ServiceType.TRUSTED_ADVISOR]: 'Management-Governance/Trusted-Advisor.svg',
  
  // Developer Tools
  [ServiceType.CODECOMMIT]: 'Developer-Tools/CodeCommit.svg',
  [ServiceType.CODEBUILD]: 'Developer-Tools/CodeBuild.svg',
  [ServiceType.CODEDEPLOY]: 'Developer-Tools/CodeDeploy.svg',
  [ServiceType.CODEPIPELINE]: 'Developer-Tools/CodePipeline.svg',
  [ServiceType.CODEARTIFACT]: 'Developer-Tools/CodeArtifact.svg',
  [ServiceType.CLOUD9]: 'Developer-Tools/Cloud9.svg',
  [ServiceType.X_RAY]: 'Developer-Tools/X-Ray.svg',
  
  // Machine Learning
  [ServiceType.SAGEMAKER]: 'Machine-Learning/SageMaker.svg',
  [ServiceType.COMPREHEND]: 'Machine-Learning/Comprehend.svg',
  [ServiceType.REKOGNITION]: 'Machine-Learning/Rekognition.svg',
  [ServiceType.TEXTRACT]: 'Machine-Learning/Textract.svg',
  [ServiceType.TRANSLATE]: 'Machine-Learning/Translate.svg',
  [ServiceType.TRANSCRIBE]: 'Machine-Learning/Transcribe.svg',
  [ServiceType.POLLY]: 'Machine-Learning/Polly.svg',
  [ServiceType.LEX]: 'Machine-Learning/Lex.svg',
  
  // Migration & Transfer
  [ServiceType.DMS]: 'Migration-Transfer/Database-Migration-Service.svg',
  [ServiceType.TRANSFER_FAMILY]: 'Migration-Transfer/Transfer-Family.svg',
  [ServiceType.MIGRATION_HUB]: 'Migration-Transfer/Migration-Hub.svg',
  [ServiceType.DATASYNC]: 'Migration-Transfer/DataSync.svg',
  [ServiceType.SNOWBALL]: 'Migration-Transfer/Snowball.svg',
  
  // Application Integration
  [ServiceType.AMPLIFY]: 'Front-End-Web-Mobile/Amplify.svg'
}

const iconPath = computed(() => {
  if (iconError.value) return null
  
  const iconFile = SERVICE_TYPE_TO_ICON[props.serviceType]
  if (!iconFile) return null
  
  // Icons are in the public folder, accessible via direct URL
  return `/icons/aws/${iconFile}`
})
</script>

<style scoped>
.aws-service-icon {
  width: v-bind('`${size}px`');
  height: v-bind('`${size}px`');
  object-fit: contain;
}

.aws-service-icon-fallback {
  width: v-bind('`${size}px`');
  height: v-bind('`${size}px`');
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 10px;
  text-align: center;
  color: #666;
  padding: 4px;
}
</style>
