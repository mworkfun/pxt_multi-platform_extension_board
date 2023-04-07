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

//% color="#ff6800" icon="\uf002" weight=15
//% groups="['Display-Buttom', 'RGB-led', 'Neo-pixel', 'Sensor', 'Tone']"
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

    /////////////////////////////////////////////////////
    //% block="Digital-Tube-Button_Init"
    //% group="Digital-Tube_Button" weight=6
    export function Digital_Tube_Button_Init() {
        pins.spiPins(15, 14, 13);
        pins.spiFormat(8, 3);
        pins.spiFrequency(60000);
    }

    ////////////////////////////////////////////
    //            bit: 0 0 0  x x x x x
    // Read key value: 0 0 0 OK U D L R
    // x = 1, There's no button to press. 
    // x = 0, There are buttons to press.
    //% block="Button"
    //% group="Digital-Tube_Button" weight=5
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
    //% group="Digital-Tube_Button" weight=4
    export function Digital_Tube_Clear() {
        BC7278_spi_write_data(GloReg, 0xff);
    }

    ////////////////////////////////////////////
    // display: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A,  b,  C,  d,  E,  F
    // Number : 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
    // Position : 0, 1, 2, 3
    //% block="Digital-Tube_Char: position $Position num $Number"
    //% Position.min=0 Position.max=3 Number.min=0 Number.max=15
    //% group="Digital-Tube_Button" weight=3
    export function Digital_Tube_Char(Position: number, Number: number) {
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
}