import { BaseCollector } from "../../base";
import { CollectorUtil } from '../../../utils'
import { LogUtil } from '../../../utils/log';
import { CredentialsReportCollector } from '../iam';

export class AccountIdCollector extends BaseCollector {
    collect() {
        return this.getAccountId();
    }

    private async getAccountId() {
        try {
            const credentialsReportCollector = new CredentialsReportCollector()
            credentialsReportCollector.setSession(this.getSession())
            const credsReportData = await CollectorUtil.cachedCollect(credentialsReportCollector);
            if (credsReportData.credentials) {
                const rootAccountDetails = credsReportData.credentials.find((credential) => {
                    return credential.user === "<root_account>";
                });
                if(rootAccountDetails) {
                    return { id: this.getAccountIdFromArn(rootAccountDetails.arn)};
                }
            }

        } catch (error) {
            LogUtil.error(error);
        }
    }

    private getAccountIdFromArn(arn) {
        return arn.split(":")[4];
    }
}
