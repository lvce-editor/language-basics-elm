module ViewModel exposing (ViewModel, viewModel)

type alias ViewModel =
    { heading : String, total : Int }

viewModel model =
    { heading = String.toUpper model.title
    , total = List.length model.items
    }
