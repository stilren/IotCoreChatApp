import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iot from '@aws-cdk/aws-iot';
import * as iam from '@aws-cdk/aws-iam';
import * as customResource from '@aws-cdk/custom-resources';
import * as secrets from "../../secrets.json"
const authorizerName = "customAuthorizer"

export class IotCoreChatBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const customAuthorizerLambdaMQTT = new lambda.Function(this, 'iot-custom-auth-mqtt', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'auth.handler',
      code: new lambda.AssetCode('src/auth'),
      environment: {
        "AWS_ACCOUNT": this.account,
        "PASSWORD": secrets.mqttAuthPassword,
      }
    })

    const authorizer = new iot.CfnAuthorizer(this,
      "iotauthorizer",
      {
        authorizerFunctionArn: customAuthorizerLambdaMQTT.functionArn,
        authorizerName: authorizerName,
        status: "ACTIVE",
        signingDisabled: true
      }
    )

    customAuthorizerLambdaMQTT.addPermission('AllowIotInvocation',{
      principal:  new iam.ServicePrincipal('iot.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: authorizer.attrArn,
    })

    new customResource.AwsCustomResource(this, 'SetDefaultAuthorizer', {
      onCreate: {
        service: 'Iot',
        action: 'setDefaultAuthorizer',
        physicalResourceId: customResource.PhysicalResourceId.fromResponse('authorizerArn'),
        parameters: {
          "authorizerName": authorizerName
        }
      },
      onDelete: {
        service: 'Iot',
        action: 'clearDefaultAuthorizer',
      },
      policy: customResource.AwsCustomResourcePolicy.fromSdkCalls({ resources: customResource.AwsCustomResourcePolicy.ANY_RESOURCE })
    });

    const getIoTEndpoint = new customResource.AwsCustomResource(this, 'IoTEndpoint', {
      onCreate: {
        service: 'Iot',
        action: 'describeEndpoint',
        physicalResourceId: customResource.PhysicalResourceId.fromResponse('endpointAddress'),
        parameters: {
          "endpointType": "iot:Data-ATS"
        },
      },
      policy: customResource.AwsCustomResourcePolicy.fromSdkCalls({ resources: customResource.AwsCustomResourcePolicy.ANY_RESOURCE })
    });

    const iotEndpoint = getIoTEndpoint.getResponseField('endpointAddress');
    new cdk.CfnOutput(this, "IOT", { value: iotEndpoint })
  }
}