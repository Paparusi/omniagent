import Darwin
import Testing
@testable import OmniAgentDiscovery

@Suite
struct WideAreaGatewayDiscoveryTests {
    @Test func discoversBeaconFromTailnetDnsSdFallback() {
        setenv("OMNIAGENT_WIDE_AREA_DOMAIN", "omniagent.internal", 1)
        let statusJson = """
        {
          "Self": { "TailscaleIPs": ["100.69.232.64"] },
          "Peer": {
            "peer-1": { "TailscaleIPs": ["100.123.224.76"] }
          }
        }
        """

        let context = WideAreaGatewayDiscovery.DiscoveryContext(
            tailscaleStatus: { statusJson },
            dig: { args, _ in
                let recordType = args.last ?? ""
                let nameserver = args.first(where: { $0.hasPrefix("@") }) ?? ""
                if recordType == "PTR" {
                    if nameserver == "@100.123.224.76" {
                        return "steipetacstudio-gateway._omniagent-gw._tcp.omniagent.internal.\n"
                    }
                    return ""
                }
                if recordType == "SRV" {
                    return "0 0 18789 steipetacstudio.omniagent.internal."
                }
                if recordType == "TXT" {
                    return "\"displayName=Peter\\226\\128\\153s Mac Studio (OmniAgent)\" \"gatewayPort=18789\" \"tailnetDns=peters-mac-studio-1.sheep-coho.ts.net\" \"cliPath=/Users/steipete/omniagent/src/entry.ts\""
                }
                return ""
            })

        let beacons = WideAreaGatewayDiscovery.discover(
            timeoutSeconds: 2.0,
            context: context)

        #expect(beacons.count == 1)
        let beacon = beacons[0]
        let expectedDisplay = "Peter\u{2019}s Mac Studio (OmniAgent)"
        #expect(beacon.displayName == expectedDisplay)
        #expect(beacon.port == 18789)
        #expect(beacon.gatewayPort == 18789)
        #expect(beacon.tailnetDns == "peters-mac-studio-1.sheep-coho.ts.net")
        #expect(beacon.cliPath == "/Users/steipete/omniagent/src/entry.ts")
    }
}
