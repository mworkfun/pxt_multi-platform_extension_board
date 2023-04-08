// Multi-platform_extension_board for microbit
// author: jalen
// github:https://github.com/mosiwi
// Write the date: 2023-4-7

const enum segment{
    dp = 0b10000000,
    g  = 0b01000000,
    f  = 0b00100000,
    e  = 0b00010000,
    d  = 0b00001000,
    c  = 0b00000100,
    b  = 0b00000010,
    a  = 0b00000001
}

const enum OnOff {
    On  = 1,
    Off = 0
}

const enum RgbLedPin {
    R_Pin = 0,
    G_Pin = 1,
    B_Pin = 12
}

const enum Humiture {
    Temperature = 0,
    Humidity = 1
}

const enum Veer {
    CW = 0,
    CCW = 1
}

//% color="#ff6800" icon="\uf002" weight=15
//% groups="['Display-Buttom', 'Led', 'RGB-Led', 'Humiture', 'Ultrasonic', 'Fan', 'Buzzer', 'Button']"
namespace Multi_platform {
    // They correspond to 4-bit digital tube and can control 8 digital sections of the code tube.
    // default = 0xff, bit: on = 0, off = 1
    // D7  D6  D5  D4  D3  D2  D1  D0
    // DP  G   F   E   D   C   B   A
    const DisReg0 = 0x00;
    const DisReg1 = 0x01;
    const DisReg2 = 0x02;
    const DisReg3 = 0x03;

    // The user can input the value and get the digital display directly.
    // D7  D6  D5  D4  D3  D2  D1  D0
    // A3  A2  A1  A0  d3  d2  d1  d0
    // A3:A0 controls which digit bits are displayed.
    // d3:d0 = 0---F
    const DecReg = 0x1B;

    // Realize display control in unit of segment
    //    DP   G   F   E   D   C   B   A
    // 0  07   06  05  04  03  02  01  00
    // 1  0F   0F  0D  0C  0B  0A  09  08   
    // 2  17   16  15  14  13  12  11  10
    // 3  1F   1E  1D  1C  1B  1A  19  18
    // data format:
    // D7  D6  D5  D4  D3  D2  D1  D0
    // Seg A6  A5  A4  A3  A2  A1  A0
    // A5:A0 = data address, Seg = 0 = on, Seg = 1 = off  
    const SegAddReg = 0x1C;

    // Clear the screen or light up all leds.
    const GloReg = 0x1D;

    function BC7278_spi_read_data(addr:number, dat:number) {
        let data: number = (addr << 8) + dat;
        data = pins.spiWrite(data);
        return data;
    }

    function BC7278_spi_write_data(addr: number, dat: number) {
        let data: number = (addr << 8) + dat;
        pins.spiWrite(data);
    }

    ////////////////////////////////////////////
    // display segment
    // Seg   DP    G    F    E    D    C    B    A
    // Bit 
    //  0    7h    6h   5h   4h   3h   2h   1h   0h
    //  1    fh    eh   dh   ch   bh   ah   9h   8h
    //  2    17h   16h  15h  14h  13h  12h  11h  10h
    //  3    1fh   1eh  1dh  1ch  1bh  1ah  19h  18h
    //  
    // OnOff = 1 = on, OnOff = 0 = off
    function SetDisplaySeg(Seg: number, OnOff: number){
        if (OnOff != 0 && OnOff != 1)
            return;
        Seg = ((~OnOff) << 7) + Seg;
        BC7278_spi_write_data(SegAddReg, Seg);
    }

    /////////////////////////////////////////////////////
    //% block="Digital-Tube-Button_Init"
    //% group="Digital-Tube_Button" weight=7
    export function Digital_Tube_Button_Init() {
        pins.spiPins(15, 14, 13);
        pins.spiFormat(8, 3);
        pins.spiFrequency(60000);
    }

    ////////////////////////////////////////////
    //% block="Button_Interrupt-pin"
    //% group="Digital-Tube_Button" weight=6
    export function Buton_pin() {
        return 11;
    }

    ////////////////////////////////////////////
    //            bit: 0 0 0  x x x x x
    // Read key value: 0 0 0 OK U D L R
    // x = 1, There's no button to press. 
    // x = 0, There are buttons to press.
    //% block="Button"
    //% group="Digital-Tube_Button" weight=6
    export function Read_button(DG: number, Dat: number) {
        // 0xff: pseudoinstruction
        // Gets 16 key values
        let AllKey: number = BC7278_spi_read_data(0xff, 0xff);
        // Serial.println(AllKey, HEX);

        // After processing data, obtain the key values of S12-S15.
        let keyValue: number = (~AllKey) >> 11;
        // Serial.println(keyValue, HEX);

        return keyValue;
    }

    /////////////////////////////////////////////////////
    //% block="Digital-Tube_Clear"
    //% group="Digital-Tube_Button" weight=5
    export function Digital_Tube_Clear() {
        BC7278_spi_write_data(GloReg, 0xff);
    }

    ////////////////////////////////////////////
    // display: 0-9999 or 0.0-999.9
    //% block="Digital-Tube_Num: $num"
    //% group="Digital-Tube_Button" weight=4
    export function DisplayNumber(num: number) {
        let dat: number = 0;
        let i_f: number = 0;
        if (parseInt(num.toString()) == parseFloat(num.toString())) {  //integer
            i_f = 0;
            SetDisplaySeg(0x17, 0);           // Turn off the decimal point.
        }
        else{                                                          //flaot
            i_f = 1;
            dat = ~~(num*10);
            SetDisplaySeg(0x17, 1);           // Turn on the decimal point.
        }

        //Digital_Tube_Seg(0x17, 0);          // Turn off the decimal point.
        if (dat / 1000 != 0) {
            Digital_Tube_Num(0, dat / 1000);
            Digital_Tube_Num(1, dat % 1000 / 100);
            Digital_Tube_Num(2, dat % 100 / 10);
            Digital_Tube_Num(3, dat % 10);
            return;
        }
        if (dat % 1000 / 100 != 0) {
            Digital_Tube_Seg(0, 0xff);
            Digital_Tube_Num(1, dat % 1000 / 100);
            Digital_Tube_Num(2, dat % 100 / 10);
            Digital_Tube_Num(3, dat % 10);
            return;
        }

        if (i_f == 0){
            if (dat % 1000 / 10 != 0) {
                Digital_Tube_Seg(0, 0xff);
                Digital_Tube_Seg(1, 0xff);
                Digital_Tube_Num(2, dat % 100 / 10);
                Digital_Tube_Num(3, dat % 10);
                return;
            }
            Digital_Tube_Seg(0, 0xff);
            Digital_Tube_Seg(1, 0xff);
            Digital_Tube_Seg(2, 0xff);
            Digital_Tube_Num(3, dat % 10);
        }
        else{
            Digital_Tube_Seg(0, 0xff);
            Digital_Tube_Seg(1, 0xff);
            Digital_Tube_Num(2, dat % 100 / 10);
            Digital_Tube_Num(3, dat % 10);
        }
    }

    ////////////////////////////////////////////
    // display: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A,  b,  C,  d,  E,  F
    // Number : 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
    // Position : 0, 1, 2, 3
    //% block="Digital-Tube_Num: position $Position num $Number"
    //% Position.min=0 Position.max=3 Number.min=0 Number.max=15
    //% group="Digital-Tube_Button" weight=3
    export function Digital_Tube_Num(Position: number, Number: number) {
        if (Position > 3 || Number > 15)
            return;
        let dat: number = 0;
        dat = (Position << 4) | Number;
        BC7278_spi_write_data(DecReg, dat);
    }

    ////////////////////////////////////////////
    // segment
    // Seg = xxxxxxxx = DP, G, F, E, D, C, B, A (x=0=on, x=1=off)
    //% block="Segment: $Seg"
    //% group="Digital-Tube_Button" weight=2
    export function Segment(Seg: segment) {
        return Seg;
    }

    ////////////////////////////////////////////
    // display segment
    // Position: 0--3
    // Seg = xxxxxxxx = DP, G, F, E, D, C, B, A (x=0=on, x=1=off)
    //% block="Digital-Tube_Seg: position $Position segment $Seg"
    //% Position.min=0 Position.max=3
    //% group="Digital-Tube_Button" weight=1
    export function Digital_Tube_Seg(Position: number, Seg: number) {
        let addr: number = 0;
        switch (Position) {
            case 0: addr = DisReg0; break;
            case 1: addr = DisReg1; break;
            case 2: addr = DisReg2; break;
            case 3: addr = DisReg3; break;
            default: return;
        }
        BC7278_spi_write_data(addr, Seg);
    }



    const LSBFIRST: number = 1;
    const MSBFIRST: number = 0;
    let ledData: number = 0;

    //////////////////////////////////////////////////////////////
    // Send 8-bit data to 74HC595.
    // bitOrder: MSBFIRST or LSBFIRST
    function ShiftOut(bitOrder: number, val: number){
        let i: number;
        for (i = 0; i < 8; i++) {
            if (bitOrder == LSBFIRST) {
                pins.digitalWritePin(16, val & 1);
                val >>= 1;
            } else {
                pins.digitalWritePin(16, val & 128);
                val <<= 1;
            }
            pins.digitalWritePin(8, 1);
            control.waitMicros(10);
            pins.digitalWritePin(8, 0);
            control.waitMicros(10);
        }
    }

    ////////////////////////////////////////////
    //% block="$Onoff"
    //% group="Led" weight=2
    export function On_Off(Onoff: OnOff) {
        return Onoff;
    }

    ////////////////////////////////////////////
    // LED
    //% block="Set $Pos led  $OnOff"
    //% Pos.min=0 Pos.max=7
    //% group="Led" weight=1
    export function Set_Led(Pos: number, OnOff: number){
        if (Pos > 8 || OnOff > 1) {
            return;
        }
        if (OnOff == 1) {
            ledData = ledData | (1 << Pos);
        }
        else {
            ledData = ledData & (~(1 << Pos));
        }
        //ground latchPin and hold low for as long as you are transmitting
        pins.digitalWritePin(9, 0);
        ShiftOut(MSBFIRST, ledData);
        //no longer needs to listen for information
        pins.digitalWritePin(9, 1);
    }



    ////////////////////////////////////////////
    //% block="$Pin"
    //% group="RGB_Led" weight=1
    export function RgbLed_pin(Pin: RgbLedPin) {
        return Pin;
    }



    // AHT20 Register address		
    const reg1_ = 0x1b;
    const reg2_ = 0x1c;
    const reg3_ = 0x1e;
    const ac_   = 0xac;
    const ac_d1 = 0x33;
    const ac_d2 = 0x00;
    const aht20Addr = 0x38;
    let ct = [0, 0];

    ////////////////////////////////////////////
    function SendAC(){
        pins.i2cWriteNumber(aht20Addr, ac_, NumberFormat.Int8LE, true);
        pins.i2cWriteNumber(aht20Addr, ac_d1, NumberFormat.Int8LE, true);
        pins.i2cWriteNumber(aht20Addr, ac_d2, NumberFormat.Int8LE, false);
    }

    ////////////////////////////////////////////
    function Reset_REG(reg: number){
        let  Byte = [ 0, 0, 0];

        pins.i2cWriteNumber(aht20Addr, reg, NumberFormat.Int8LE, true);
        pins.i2cWriteNumber(aht20Addr, 0x00, NumberFormat.Int8LE, true);
        pins.i2cWriteNumber(aht20Addr, 0x00, NumberFormat.Int8LE, false);

        basic.pause(5);
        Byte[0] = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, true);
        Byte[1] = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, true);
        Byte[2] = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, false);

        basic.pause(10);
        pins.i2cWriteNumber(aht20Addr, 0xb0 | reg, NumberFormat.Int8LE, true);
        pins.i2cWriteNumber(aht20Addr, Byte[1], NumberFormat.Int8LE, true);
        pins.i2cWriteNumber(aht20Addr, Byte[2], NumberFormat.Int8LE, false);
    }

    ////////////////////////////////////////////
    function Read_Status(){
        let stat;
        stat = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, false);
        return stat;
    }

    ////////////////////////////////////////////
    //% block="AHT20_Init"
    //% group="Humiture" weight=3
    ////////////////////////////////////////////
    export function AHT20_Init(){
        Reset_REG(reg1_);
        Reset_REG(reg2_);
        Reset_REG(reg3_);
    }

    ///////////////////////////////////////////
    //No CRC check, read AHT20 temperature and humidity data directly
    //% block="Read_humiture"
    //% group="Humiture" weight=2
    export function Read_CTdata(){
        let  Byte = [0, 0, 0, 0, 0, 0];
        let  RetuData = 0;
        let  cnt = 0;

        SendAC();                // Send the AC command to AHT20
        basic.pause(80);

        //Until bit[7] is 0, indicating idle state. If it is 1, indicating busy state
        while (((Read_Status() & 0x80) == 0x80)) {
            basic.pause(2);
            if (cnt++ >= 100) {
                return false;
            }
        }
        Byte[0] = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, true);
        Byte[1] = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, true);
        Byte[2] = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, true);
        Byte[3] = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, true);
        Byte[4] = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, true);
        Byte[5] = pins.i2cReadNumber(aht20Addr, NumberFormat.Int8LE, false);

        // Byte[0]  //Status word: the state is 0x98, indicating busy state, and bit[7] is 1.  The state is 0x1C, or 0x0C, or 0x08 is idle, and bit[7] is 0.  
        // Byte[1]  //humidity 
        // Byte[2]  //humidity 
        // Byte[3]  //humidity / temperature
        // Byte[4]  //temperature 
        // Byte[5]  //temperature 
        RetuData = (RetuData | Byte[1]) << 8;
        RetuData = (RetuData | Byte[2]) << 8;
        RetuData = (RetuData | Byte[3]);
        RetuData = RetuData >> 4;
        ct[0] = RetuData * 100 / 1024 / 1024;           //humidity 
        RetuData = 0;
        RetuData = (RetuData | Byte[3]) << 8;
        RetuData = (RetuData | Byte[4]) << 8;
        RetuData = (RetuData | Byte[5]);
        RetuData = RetuData & 0xfffff;
        ct[1] = RetuData * 200 / 1024 / 1024 - 50;        //temperature 
        return true;
    }

    ////////////////////////////////////////////
    //% block="$TH"
    //% group="Humiture" weight=1
    ////////////////////////////////////////////
    export function Humiture_data(TH: Humiture) {
        if (TH == Humiture.Humidity){
            return ct[0];
        }
        else{
            return ct[1];
        }
    }



    ////////////////////////////////////////////
    //% block="Ultrasonic(cm)"
    //% group="Ultrasonic" weight=1
    ////////////////////////////////////////////
    export function Ultrasonic_(TH: Humiture) {
        let t: number = 0;

        pins.digitalWritePin(0, 1);
        control.waitMicros(10);
        pins.digitalWritePin(0, 0);

        t = pins.pulseIn(DigitalPin.P1, PulseValue.High);
        return t/29/2;
    }



    ////////////////////////////////////////////
    //% block="Fan $_Veer speed $Speed"
    //% group="Fan" weight=1
    ////////////////////////////////////////////
    export function Fan_(_Veer: Veer, Speed: number) {
        if (_Veer == Veer.CW){
            pins.digitalWritePin(0, 0);
            pins.analogWritePin(1, Speed)
        }
        else{
            pins.analogWritePin(0, Speed)
            pins.digitalWritePin(1, 0);
        }
    }


    ////////////////////////////////////////////
    //% block="Buzzer_Pin"
    //% group="Buzzer" weight=1
    export function Buzzer_pin() {
        return 3;
    }


    ////////////////////////////////////////////
    //% block="Button_Pin"
    //% group="Button" weight=1
    export function Button_pin() {
        return 5;
    }
}