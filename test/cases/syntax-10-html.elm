module HtmlExample exposing (view)

import Html exposing (Html, button, div, span, text)
import Html.Attributes exposing (class)

view : Html msg
view =
    div [ class "card" ]
        [ span [] [ text "Elm" ]
        , button [] [ text "Save" ]
        ]
