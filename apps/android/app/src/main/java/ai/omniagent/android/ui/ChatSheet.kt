package ai.omniagent.android.ui

import androidx.compose.runtime.Composable
import ai.omniagent.android.MainViewModel
import ai.omniagent.android.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
