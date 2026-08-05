module CustomTypes exposing (Status(..))

type Status
    = Idle
    | Loading Float
    | Ready String
    | Failed { message : String }
