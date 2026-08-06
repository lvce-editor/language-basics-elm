module ExposingFunctions exposing (Model, init, subscriptions)

import Html exposing (Html, button, div, text)
import Task exposing (Task, perform)

type alias Model =
    { ready : Bool }

init =
    Task.perform Ready load

subscriptions model =
    Sub.none
