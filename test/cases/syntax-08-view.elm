module View exposing (view)

import Html exposing (Html, div, text)

view : Model -> Html Msg
view model =
    div [] [ text model.title ]
