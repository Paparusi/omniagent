package ai.omniagent.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class OmniAgentProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", OmniAgentCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", OmniAgentCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", OmniAgentCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", OmniAgentCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", OmniAgentCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", OmniAgentCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", OmniAgentCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", OmniAgentCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", OmniAgentCapability.Canvas.rawValue)
    assertEquals("camera", OmniAgentCapability.Camera.rawValue)
    assertEquals("screen", OmniAgentCapability.Screen.rawValue)
    assertEquals("voiceWake", OmniAgentCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", OmniAgentScreenCommand.Record.rawValue)
  }
}
