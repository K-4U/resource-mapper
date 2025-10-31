# AWS Icons Setup

This project uses AWS service icons from [IcePanel](https://icon.icepanel.io/).

## Automatic Download

The icons are automatically downloaded during `npm install` via the postinstall script.

- **Source**: https://icon.icepanel.io/AWS/svg.zip
- **Location**: `frontend/public/icons/aws/`
- **Note**: Icons are NOT committed to git (see `.gitignore`)

## Manual Download

If automatic download fails, you can manually download and extract:

1. Download: https://icon.icepanel.io/AWS/svg.zip
2. Extract to: `frontend/public/icons/aws/`

## Usage

Icons are accessed via the `AwsServiceIcon` component:

```vue
<AwsServiceIcon :service-type="ServiceType.LAMBDA" :size="48" />
```

The component supports 130+ AWS services with automatic icon mapping and aliases (e.g., VALKEY → ElastiCache icon, ALB/NLB/ELB → Load Balancing icon).
