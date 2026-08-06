module Main exposing (init, main, update)

main : Program Flags Model Msg
main =
    Browser.element { init = init, update = update, view = view }

init flags =
    createModel flags

update message model =
    applyMessage message model

view model =
    render model
