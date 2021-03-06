import { BaseAnalyzer } from '../../base'
import { CheckAnalysisResult, ResourceAnalysisResult, Dictionary, SeverityStatus, CheckAnalysisType } from '../../../types';

export class RDPPortOpenToWorldAnalyzer extends BaseAnalyzer {
    analyze(params: any, fullReport?: any): any {
        const allSecurityGroups = params.security_groups;
        if (!allSecurityGroups) {
            return undefined;
        }
        const rdp_port_open_to_world: CheckAnalysisResult = { type: CheckAnalysisType.Security };
        rdp_port_open_to_world.what = "Is RDP port open to world?";
        rdp_port_open_to_world.why = "We should always restrict RDP port only intended parties to access";
        rdp_port_open_to_world.recommendation = "Recommended to restrict RDP port in security groups to specific IPs";
        const allRegionsAnalysis : Dictionary<ResourceAnalysisResult[]> = {};
        for (let region in allSecurityGroups) {
            let regionSecurityGroups = allSecurityGroups[region];
            allRegionsAnalysis[region] = [];
            for (let securityGroup of regionSecurityGroups) {
                if(securityGroup.GroupName == 'default') {
                    continue;
                }
                let securityGroupAnalysis: ResourceAnalysisResult = {};
                securityGroupAnalysis.resource = securityGroup;
                securityGroupAnalysis.resourceSummary = {
                    name: 'SecurityGroup',
                    value: `${securityGroup.GroupName} | ${securityGroup.GroupId}`
                }
                if (this.isRDPOpenToWorld(securityGroup)) {
                    securityGroupAnalysis.severity = SeverityStatus.Failure;
                    securityGroupAnalysis.message = 'RDP Port is open to entire world';
                    securityGroupAnalysis.action = 'Restrict RDP port'
                } else {
                    securityGroupAnalysis.severity = SeverityStatus.Good;
                    securityGroupAnalysis.message = 'RDP port is not open to entire world';
                }
                allRegionsAnalysis[region].push(securityGroupAnalysis);
            }
        }
        rdp_port_open_to_world.regions = allRegionsAnalysis;
        return { rdp_port_open_to_world };
    }

    private isRDPOpenToWorld(securityGroup: any) {
        if(!securityGroup) {
            return false;
        }

        return securityGroup.IpPermissions.some((rule) => {
            return rule.FromPort === 3389 && rule.IpRanges.some((ipRange) => {
                return ipRange.CidrIp === '0.0.0.0/0';
            });
        });
    }
}