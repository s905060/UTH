var ActiveCard      = 0;
var PlayerCard      = [-1, -1];
var StreetCard      = [-1, -1, -1, -1, -1];
var Help            = 0;
var Used            = new Array(52);
var DetailAction    = 0;
var DetailLevel     = 0;
var NotRaise        = "";
var Result          = [];
var LevelName       = ["Summary", "Full Details", "by Prize", "by Final Hand", "by Action", "by Showdown Result", "by Dealer Qualification"];

function Obj(i)
{
    return document.getElementById(i);
}

function ChooseDetailAction(n)
{
    DetailAction = n;
    UpdateDetails();
}

function ChooseDetailLevel(n)
{
    DetailLevel = n;
    UpdateDetails();
}

function ClearOutput()
{
    Obj("result").style.display  = "none";
    Obj("details").style.display = "none";
}

function Calculate()
{
    ClearOutput();

    var p0 = (PlayerCard[0] >= 0);
    var p1 = (PlayerCard[1] >= 0);

    var f0 = (StreetCard[0] >= 0);
    var f1 = (StreetCard[1] >= 0);
    var f2 = (StreetCard[2] >= 0);
    var f3 = (StreetCard[3] >= 0);
    var f4 = (StreetCard[4] >= 0);

    var dp1 = p0 && p1 && (!(f0 || f1 || f2 || f3 || f4));
    var dp2 = p0 && p1 && f0 && f1 && f2 && (!(f3 || f4));
    var dp3 = p0 && p1 && f0 && f1 && f2 &&    f3 && f4  ;

    var cards = "";

    if (dp1)
    {
        NotRaise = "Check";
        cards = [PlayerCard[0], PlayerCard[1]].join();

    }
    else if (dp2)
    {
        NotRaise = "Check";
        cards = [PlayerCard[0], PlayerCard[1], StreetCard[0], StreetCard[1], StreetCard[2]].join();
    }
    else if (dp3)
    {
        NotRaise = "Fold";
        cards = [PlayerCard[0], PlayerCard[1], StreetCard[0], StreetCard[1], StreetCard[2], StreetCard[3], StreetCard[4]].join();
    }
    else
    {
        return;
    }

    $.ajax
    (
        "https://wizardofodds.com/games/ultimate-texas-hold-em/calculator/calculate.php",
        {
            async       : true,
            data        : { c : cards },
            dataType    : "json",
            error       : AjaxError,
            success     : FinishCalc,
            timeout     : 2000,
            type        : "GET"
        }
    );
}

function AjaxError(jqXHR, textStatus, errorThrown)
{
}

function FinishCalc(data, textStatus, jqXHR)
{
    Result = data;

    if (Result.Error) { return; }

    for (var x = 0; x < 2; x++) {
    for (var y = 0; y < 7; y++) {

        Obj("details" + y + x).innerHTML = Result.Details[x][y];

    } }

    DetailAction = (Result.RaiseEV > Result.CheckEV ? 0 : 1);
    DetailLevel  = 0;

    Obj("menu0").disabled = true; Obj("menu0").selectedIndex = DetailLevel;  Obj("menu0").disabled = false;
    Obj("menu1").disabled = true; Obj("menu1").selectedIndex = DetailAction; Obj("menu1").options[1].innerHTML = NotRaise + "ing"; Obj("menu1").disabled = false;

    window.focus();

    Obj("result") .innerHTML     = (DetailAction == 0 ? "Raise" : NotRaise);
    Obj("result") .style.display = "block";

    UpdateDetails();
}

function NewHand()
{
    ClearOutput();
    Reset();
    ActiveCard = 0;
    Update();
}

function RandomScenario()
{
    NewHand();

    var s = [0, 3, 5][Math.floor(Math.random() * 3)];

    var deck = [];

    for (var x = 0; x < 52; x++)
    {
        deck[x] = x;
    }

    for (var x = 51; x > 0; x--)
    {
        var r = Math.floor(Math.random() * x);

        deck[x] ^= deck[r];
        deck[r] ^= deck[x];
        deck[x] ^= deck[r];
    }

    var pos = 0;

    PlayerCard[0] = deck[pos++]; Used[PlayerCard[0]] = true;
    PlayerCard[1] = deck[pos++]; Used[PlayerCard[1]] = true;

    for (var x = 0; x < s; x++)
    {
        StreetCard[x] = deck[pos++]; Used[StreetCard[x]] = true;
    }

    Update(true);
}

function Reset()
{
    for (var x = 0; x < 52; x++)
    {
        Used[x] = false;
    }

    PlayerCard  = [[-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1], [-1, -1]];
    StreetCard  = [-1, -1, -1, -1, -1];
}

function ReturnCard(n)
{
    var calc = false;

    if ((n < 2) && (PlayerCard[n] >= 0))
    {
        calc = Used[PlayerCard[n]];
        Used[PlayerCard[n]] = false;
        /**/ PlayerCard[n]  = -1;
    }
    else if (StreetCard[n - 2] >= 0)
    {
        calc = Used[StreetCard[n - 2]];
        Used[StreetCard[n - 2]] = false;
        /**/ StreetCard[n - 2]  = -1;
    }

    ActiveCard = n;

    Update(calc);
}

function SelectCard(n)
{
    if (ActiveCard < 2)
    {
        if (PlayerCard[ActiveCard] >= 0)
        {
            Used[PlayerCard[ActiveCard]] = false;
            PlayerCard[ActiveCard] = -1;
        }
    }
    else
    {
        if (StreetCard[ActiveCard - 2] >= 0)
        {
            Used[StreetCard[ActiveCard - 2]] = false;
            StreetCard[ActiveCard - 2] = -1;
        }
    }

    if (!Used[n])
    {
        if (ActiveCard < 2)
        {
            PlayerCard[ActiveCard] = n;
        }
        else
        {
            StreetCard[ActiveCard - 2] = n;
        }

        Used[n] = true;

        ActiveCard = (ActiveCard + 1) % 7;
    }

    Update(true);
}

function ToggleHelp()
{
    Help ^= 1;
    Obj("help").style.display = (Help ? "block" : "none");
}

function Update(calc)
{
    for (var x = 0; x < 52; x++)
    {
        Obj("sm" + x).style.display = (Used[x] ? "none" : "block");
    }

    for (var p = 0; p < 2; p++)
    {
        Obj("hole"   + p).style.backgroundPosition = (PlayerCard[p] >= 0 ? (PlayerCard[p] * -35) + "px 0" : "36px 55px");
        Obj("hilite" + p).style.display            = (ActiveCard    == p ? "block"                        : "none");
    }

    for (var f = 0; f < 5; f++)
    {
        Obj("flop"   +  f     ).style.backgroundPosition = (StreetCard[f] >= 0       ? (StreetCard[f] * -35) + "px 0" : "36px 55px");
        Obj("hilite" + (f + 2)).style.display            = (ActiveCard    == (f + 2) ? "block"                        : "none");
    }

    if (calc)
    {
        setTimeout(Calculate, 1);
    }
}

function UpdateDetails()
{
    for (var x = 0; x < 7; x++)
    {
        for (var y = 0; y < 2; y++)
        {
            if ((DetailLevel == x) && (DetailAction == y))
            {
                Obj("details" + x + y).style.display = "block";
            }
            else
            {
                Obj("details" + x + y).style.display = "none";
            }
        }
    }

    Obj("details").style.display = "block";
}

try { var OnLoad = window.onload; } catch (e) { }

window.onload = function()
{
    try { OnLoad(); } catch (e) { }

    Reset();
    Update(false);
};
