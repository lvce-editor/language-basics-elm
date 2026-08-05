module Init exposing (init)

init : flags -> ( Model, Cmd Msg )
init flags =
    ( { count = 0, name = "Elm" }
    , Cmd.none
    )
