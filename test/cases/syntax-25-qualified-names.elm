module QualifiedNames exposing (Model, init)

import Json.Decode as Decode
import Time exposing (Posix, Zone)

type alias Model =
    { now : Time.Posix
    , zone : Time.Zone
    }

init =
    { now = Time.millisToPosix 0
    , zone = Time.utc
    }

decode =
    Decode.field "now" Decode.int
