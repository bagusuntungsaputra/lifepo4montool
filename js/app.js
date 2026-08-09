const API_URL = "https://lifepo4mon.baharimedia.net/api/battery";


// ======================================================
// GLOBAL STATE
// ======================================================

let batteryData = [];

let selectedBatterySlave = null;

let batteryStructure = "";

let isLoading = false;

let apiController = null;


// ======================================================
// HELPER
// ======================================================

function setText(id, value) {

    const el = document.getElementById(id);

    if (el) {
        el.innerText = value ?? "-";
    }
}


function num(value, decimals = 2) {

    const n = Number(value);

    if (!Number.isFinite(n)) {
        return "-";
    }

    return n.toFixed(decimals);
}


function getPower(battery) {

    return (
        Number(battery.battery_voltage || 0) *
        Number(battery.battery_current || 0)
    );
}


function getPackPower(battery) {

    return (
        Number(battery.battery_voltage || 0) *
        Number(battery.battery_current || 0)
    );
}


function getBusPower(battery) {

    return (
        Number(battery.battery_bus_voltage || 0) *
        Number(battery.battery_current || 0)
    );
}


function getSocColor(soc) {

    if (soc >= 70) {
        return "green";
    }

    if (soc >= 30) {
        return "yellow";
    }

    return "red";
}


function getModeClass(mode) {

    if (mode === "Charge") {
        return "text-blue-400";
    }

    if (mode === "Discharge") {
        return "text-yellow-400";
    }

    return "text-slate-400";
}


function getCurrentTime() {

    return new Date()
        .toLocaleTimeString("id-ID", {
            hour12: false
        })
        .replace(/\./g, ":");
}


// ======================================================
// CONNECTION STATUS
// ======================================================

function setStatusOnline() {

    setText("status", "ONLINE");
    setText("status-mobile", "ONLINE");

    const lamp =
        document.getElementById("statusLamp");

    const lampMobile =
        document.getElementById("statusLamp-mobile");

    if (lamp) {
        lamp.className =
            "w-2 h-2 rounded-full bg-green-500";
    }

    if (lampMobile) {
        lampMobile.className =
            "w-1.5 h-1.5 rounded-full bg-green-500";
    }
}


function setStatusOffline() {

    setText("status", "OFFLINE");
    setText("status-mobile", "OFFLINE");

    const lamp =
        document.getElementById("statusLamp");

    const lampMobile =
        document.getElementById("statusLamp-mobile");

    if (lamp) {
        lamp.className =
            "w-2 h-2 rounded-full bg-red-500";
    }

    if (lampMobile) {
        lampMobile.className =
            "w-1.5 h-1.5 rounded-full bg-red-500";
    }
}


// ======================================================
// CLOCK
// ======================================================

function updateClock() {

    const time = getCurrentTime();

    document
        .querySelectorAll(".clock")
        .forEach(el => {
            el.innerText = time;
        });


    const dashboardClock =
        document.getElementById(
            "dashboard-clock"
        );

    if (dashboardClock) {
        dashboardClock.innerText = time;
    }
}


updateClock();

setInterval(
    updateClock,
    1000
);


// ======================================================
// OVERVIEW
// ======================================================

function updateOverview(data) {

    const summary =
        data.summary || {};


    setText(
        "overview_total_battery",
        summary.online ?? 0
    );


    setText(
        "overview_average_soc",
        num(
            summary.average_soc,
            0
        )
    );


    setText(
        "overview_total_power",
        num(
            summary.total_power,
            1
        )
    );


    setText(
        "overview_total_current",
        num(
            summary.total_current,
            2
        )
    );


    // Desktop IP

    setText(
        "api-ip",
        summary.ip ?? "-"
    );


    // Desktop RSSI

    setText(
        "api-rssi",
        summary.rssi !== undefined
            ? summary.rssi + " dBm"
            : "-"
    );


    // Mobile IP

    setText(
        "mobile-api-ip",
        summary.ip ?? "-"
    );


    // Mobile RSSI

    setText(
        "mobile-api-rssi",
        summary.rssi !== undefined
            ? summary.rssi + " dBm"
            : "-"
    );
}


// ======================================================
// CHECK BATTERY STRUCTURE
// ======================================================

function getBatteryStructure(batteries) {

    return batteries
        .filter(
            battery =>
                battery.online === true
        )
        .map(
            battery =>
                String(battery.slave)
        )
        .sort()
        .join(",");
}


// ======================================================
// RENDER BATTERY CARDS
// ======================================================
//
// PENTING:
// Fungsi ini TIDAK dipanggil setiap 1 detik.
// Hanya ketika battery online/offline berubah.
//

function renderBatteryCards(batteries) {

    const grid =
        document.querySelector(
            '[data-purpose="battery-grid"]'
        );


    if (!grid) {
        return;
    }


    const online =
        batteries.filter(
            battery =>
                battery.online === true
        );


    grid.innerHTML = "";


    if (online.length === 0) {

        grid.innerHTML = `

            <div class="
                md:col-span-2
                lg:col-span-3
                xl:col-span-4
                bg-[#1e293b]
                border
                border-slate-800
                rounded-2xl
                p-10
                text-center
            ">

                <i class="
                    fas fa-battery-empty
                    text-slate-600
                    text-4xl
                    mb-4
                "></i>

                <p class="
                    text-slate-400
                    font-semibold
                ">
                    No battery online
                </p>

            </div>

        `;

        return;
    }


    online.forEach(
        battery => {

            const slave =
                battery.slave;


            const card =
                document.createElement(
                    "div"
                );


            card.dataset.slave =
                String(slave);


            card.className = `
                bg-[#1e293b]
                border-2
                rounded-2xl
                p-4 md:p-5
                flex
                flex-col
                relative
            `;


            card.innerHTML = `

                <!-- HEADER -->

                <div class="
                    flex
                    justify-between
                    items-start
                    mb-4 md:mb-6
                ">

                    <div>

                        <h3 class="
                            font-bold
                            text-base md:text-lg
                        ">

                            Battery #${slave}

                        </h3>


                        <p class="
                            text-slate-400
                            text-[10px] md:text-xs
                        ">

                            <span
                                data-field="manufacturer"
                            >
                                ${battery.manufacturer || "-"}
                            </span>

                            <span
                                data-field="battery-model"
                            >
                                ${battery.battery_model || ""}
                            </span>

                        </p>

                    </div>


                    <!-- POWER -->

                    <span class="
                        px-2
                        py-0.5
                        rounded
                        text-[9px]
                        md:text-[10px]
                        font-bold
                        text-slate-200
                        bg-slate-700/40
                    ">

                        POWER :

                        <span
                            data-field="power"
                        >
                            -
                        </span>

                    </span>

                </div>


                <!-- BODY -->

                <div class="
                    flex
                    gap-4 md:gap-6
                    mb-4 md:mb-8
                ">


                    <!-- BATTERY VISUAL -->

                    <div class="battery-visual">

                        <div
                            data-field="battery-level"
                            class="battery-fill bg-green-500"
                            style="height:0%"
                        ></div>


                        <div class="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            z-20
                        ">

                            <i class="
                                fas fa-bolt
                                text-white/40
                                text-[10px]
                                md:text-xs
                            "></i>

                        </div>

                    </div>


                    <!-- DATA -->

                    <div class="
                        flex-1
                        grid
                        grid-cols-2
                        gap-x-3 md:gap-x-4
                        gap-y-2 md:gap-y-3
                        text-[11px] md:text-xs
                    ">


                        <!-- SOC -->

                        <div>

                            <p class="
                                text-slate-500
                                uppercase
                                font-bold
                                text-[9px]
                                md:text-[10px]
                            ">
                                SOC
                            </p>


                            <p
                                data-field="soc"
                                class="
                                    text-base
                                    md:text-lg
                                    font-bold
                                "
                            >
                                -
                            </p>

                        </div>


                        <!-- MODE -->

                        <div>

                            <p class="
                                text-slate-500
                                uppercase
                                font-bold
                                text-[9px]
                                md:text-[10px]
                            ">
                                Mode
                            </p>


                            <p
                                data-field="mode"
                                class="font-bold"
                            >
                                -
                            </p>

                        </div>


                        <!-- VOLTAGE -->

                        <div>

                            <p class="
                                text-slate-500
                                uppercase
                                font-bold
                                text-[9px]
                                md:text-[10px]
                            ">
                                Voltage
                            </p>


                            <p
                                data-field="voltage"
                                class="font-bold"
                            >
                                -
                            </p>

                        </div>


                        <!-- MAX TEMP -->

                        <div class="
                            hidden md:block
                        ">

                            <p class="
                                text-slate-500
                                uppercase
                                font-bold
                                text-[10px]
                            ">
                                Temp (Max)
                            </p>


                            <p
                                data-field="max-temp"
                                class="font-bold"
                            >
                                -
                            </p>

                        </div>


                        <!-- CURRENT -->

                        <div>

                            <p class="
                                text-slate-500
                                uppercase
                                font-bold
                                text-[9px]
                                md:text-[10px]
                            ">
                                Current
                            </p>


                            <p
                                data-field="current"
                                class="font-bold"
                            >
                                -
                            </p>

                        </div>


                        <!-- MIN TEMP -->

                        <div class="
                            hidden md:block
                        ">

                            <p class="
                                text-slate-500
                                uppercase
                                font-bold
                                text-[10px]
                            ">
                                Temp (Min)
                            </p>


                            <p
                                data-field="min-temp"
                                class="font-bold"
                            >
                                -
                            </p>

                        </div>

                    </div>

                </div>


                <!-- FOOTER -->

                <div class="
                    flex
                    items-center
                    justify-between
                    border-t
                    border-slate-700
                    pt-3 md:pt-4
                    mt-auto
                ">


                    <div
                        data-field="footer"
                    >

                        <span
                            data-field="footer-text"
                            class="
                                text-[9px]
                                md:text-xs
                                font-bold
                                tracking-wider
                            "
                        >
                            Discharge Events :
                            <span
                                data-field="discharge"
                            >
                                -
                            </span>
                        </span>

                    </div>


                    <!-- DETAIL -->

                    <button
                        type="button"
                        class="
                            detail-battery-btn
                            bg-blue-600
                            hover:bg-blue-500
                            active:bg-blue-700
                            text-white
                            text-[9px]
                            md:text-[10px]
                            font-bold
                            px-3
                            py-1.5
                            rounded-lg
                            flex
                            items-center
                            gap-1
                            transition-colors
                            uppercase
                        "
                        data-battery-slave="${slave}"
                    >

                        Detail

                        <i class="
                            fas fa-chevron-right
                            text-[7px]
                            md:text-[8px]
                        "></i>

                    </button>

                </div>

            `;


            grid.appendChild(
                card
            );


            // Isi data pertama

            updateBatteryCard(
                battery
            );

        }
    );
}


// ======================================================
// UPDATE CARD DATA
// ======================================================
//
// Hanya mengubah nilai.
// TIDAK membuat card baru.
//

function updateBatteryCard(battery) {

    const card =
        document.querySelector(
            `[data-slave="${battery.slave}"]`
        );


    if (!card) {
        return;
    }


    const soc =
        Number(
            battery.soc || 0
        );


    const voltage =
        Number(
            battery.battery_voltage || 0
        );


    const current =
        Number(
            battery.battery_current || 0
        );


    const power =
        voltage * current;


    // ==================================================
    // MANUFACTURER
    // ==================================================

    const manufacturer =
        card.querySelector(
            '[data-field="manufacturer"]'
        );


    if (manufacturer) {

        manufacturer.innerText =
            battery.manufacturer || "-";
    }


    // ==================================================
    // MODEL
    // ==================================================

    const model =
        card.querySelector(
            '[data-field="battery-model"]'
        );


    if (model) {

        model.innerText =
            battery.battery_model || "";
    }


    // ==================================================
    // SOC
    // ==================================================

    const socEl =
        card.querySelector(
            '[data-field="soc"]'
        );


    if (socEl) {

        socEl.innerText =
            num(soc, 0) + "%";
    }


    // ==================================================
    // VOLTAGE
    // ==================================================

    const voltageEl =
        card.querySelector(
            '[data-field="voltage"]'
        );


    if (voltageEl) {

        voltageEl.innerText =
            num(
                voltage,
                2
            ) + " V";
    }


    // ==================================================
    // CURRENT
    // ==================================================

    const currentEl =
        card.querySelector(
            '[data-field="current"]'
        );


    if (currentEl) {

        currentEl.innerText =
            num(
                current,
                2
            ) + " A";
    }


    // ==================================================
    // POWER
    // ==================================================

    const powerEl =
        card.querySelector(
            '[data-field="power"]'
        );


    if (powerEl) {

        powerEl.innerText =
            num(
                power,
                1
            ) + " W";
    }


    // ==================================================
    // MODE
    // ==================================================

    const modeEl =
        card.querySelector(
            '[data-field="mode"]'
        );


    if (modeEl) {

        modeEl.innerText =
            battery.mode || "-";


        modeEl.className =
            "font-bold " +
            getModeClass(
                battery.mode
            );
    }


    // ==================================================
    // MAX TEMP
    // ==================================================

    const maxTemp =
        card.querySelector(
            '[data-field="max-temp"]'
        );


    if (maxTemp) {

        maxTemp.innerText =
            (
                battery.max_temp ??
                "-"
            ) + " °C";
    }


    // ==================================================
    // MIN TEMP
    // ==================================================

    const minTemp =
        card.querySelector(
            '[data-field="min-temp"]'
        );


    if (minTemp) {

        minTemp.innerText =
            (
                battery.min_temp ??
                "-"
            ) + " °C";
    }


    // ==================================================
    // DISCHARGE EVENTS
    // ==================================================

    const discharge =
        card.querySelector(
            '[data-field="discharge"]'
        );


    if (discharge) {

        discharge.innerText =
            battery.discharge_times ??
            "-";
    }


    // ==================================================
    // BATTERY LEVEL
    // ==================================================

    const level =
        card.querySelector(
            '[data-field="battery-level"]'
        );


    if (level) {

        level.style.height =
            Math.max(
                0,
                Math.min(
                    100,
                    soc
                )
            ) + "%";


        const color =
            getSocColor(soc);


        level.className =
            `battery-fill bg-${color}-500`;
    }


    // ==================================================
    // ALARM
    // ==================================================

    updateCardAlarm(
        card,
        battery
    );
}


// ======================================================
// UPDATE CARD ALARM
// ======================================================

function updateCardAlarm(card, battery) {

    const alarm =
        battery.alarm_register || {};


    const critical1 =
        Number(
            alarm.critical1 || 0
        );


    const critical2 =
        Number(
            alarm.critical2 || 0
        );


    const major =
        Number(
            alarm.major || 0
        );


    const minor =
        Number(
            alarm.minor || 0
        );


    const hasAlarm =
        critical1 > 0 ||
        critical2 > 0 ||
        major > 0 ||
        minor > 0;


    // Border

    card.classList.remove(
        "border-red-500/60",
        "border-green-500/50"
    );


    card.classList.add(
        hasAlarm
            ? "border-red-500/60"
            : "border-green-500/50"
    );


    // Footer

    const footer =
        card.querySelector(
            '[data-field="footer"]'
        );


    const footerText =
        card.querySelector(
            '[data-field="footer-text"]'
        );


    if (!footer || !footerText) {
        return;
    }


    if (hasAlarm) {

        footer.className =
            "text-red-400";


        footerText.innerHTML =
            "Alarm : CHECK";

    }
    else {

        footer.className =
            "text-green-500";


        footerText.innerHTML = `

            Discharge Events :

            <span
                data-field="discharge"
            >
                ${
                    battery.discharge_times ??
                    "-"
                }
            </span>

        `;
    }
}


// ======================================================
// FIND BATTERY
// ======================================================

function findBattery(slave) {

    return batteryData.find(
        battery =>
            String(battery.slave) ===
            String(slave)
    );
}


// ======================================================
// OPEN MODAL
// ======================================================
//
// Mendukung:
// openBatteryModal(slave)
// maupun
// openBatteryModal(index)
// dari kode lama.
//

function openBatteryModal(value) {

    let battery = null;


    // Cari berdasarkan slave terlebih dahulu

    battery =
        findBattery(value);


    // Compatibility dengan onclick lama
    // jika value ternyata index

    if (!battery) {

        const index =
            Number(value);


        if (
            Number.isInteger(index) &&
            batteryData[index]
        ) {

            battery =
                batteryData[index];
        }
    }


    if (!battery) {

        console.warn(
            "Battery tidak ditemukan:",
            value
        );

        return;
    }


    selectedBatterySlave =
        String(
            battery.slave
        );


    updateModalOnly(
        battery
    );


    const modal =
        document.getElementById(
            "batteryModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    modal.classList.add(
        "flex"
    );


    document.body.classList.add(
        "overflow-hidden"
    );
}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeBatteryModal() {

    const modal =
        document.getElementById(
            "batteryModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "flex"
    );


    modal.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "overflow-hidden"
    );


    selectedBatterySlave =
        null;
}


// ======================================================
// UPDATE MODAL
// ======================================================

function updateModalOnly(battery) {

    if (!battery) {
        return;
    }


    // ==================================================
    // HEADER
    // ==================================================

    setText(
        "modal_id_battery",
        battery.slave
    );


    setText(
        "modal_manufacture",
        battery.manufacturer
    );


    // ==================================================
    // SOC
    // ==================================================

    const soc =
        Number(
            battery.soc || 0
        );


    setText(
        "modal_soc_battery",
        num(
            soc,
            0
        ) + "%"
    );


    // ==================================================
    // BATTERY LEVEL
    // ==================================================

    const level =
        document.getElementById(
            "modal_battery_level"
        );


    if (level) {

        level.style.width =
            Math.max(
                0,
                Math.min(
                    100,
                    soc
                )
            ) + "%";


        if (soc >= 70) {

            level.className =
                "bg-blue-500 h-full";

        }
        else if (soc >= 30) {

            level.className =
                "bg-yellow-500 h-full";

        }
        else {

            level.className =
                "bg-red-500 h-full";
        }
    }


    // ==================================================
    // CAPACITY
    // ==================================================

    const capacity =
        Number(
            battery.battery_capacity || 0
        );


    setText(
        "modal_full_capacity",
        num(
            capacity,
            2
        ) + " Ah"
    );


    const remaining =
        capacity *
        soc /
        100;


    setText(
        "remaining_capacity",
        num(
            remaining,
            2
        ) + " Ah"
    );


    // ==================================================
    // DISCHARGE
    // ==================================================

    setText(
        "modal_cycle_battery",
        battery.discharge_times
    );


    // ==================================================
    // VOLTAGE
    // ==================================================

    const packVoltage =
        Number(
            battery.battery_voltage || 0
        );


    const busVoltage =
        Number(
            battery.battery_bus_voltage || 0
        );


    setText(
        "modal_battery_voltage",
        num(
            packVoltage,
            2
        ) + " V"
    );


    setText(
        "modal_bus_voltage",
        num(
            busVoltage,
            2
        ) + " V"
    );


    // ==================================================
    // CELL VOLTAGE
    // ==================================================

    setText(
        "modal_min_cell_voltage",
        num(
            battery.min_cell,
            3
        ) + " V"
    );


    setText(
        "modal_max_cell_voltage",
        num(
            battery.max_cell,
            3
        ) + " V"
    );


    setText(
        "modal_diff_cell_voltage",
        num(
            battery.diff_cell,
            0
        ) + " mV"
    );


    // ==================================================
    // CURRENT
    // ==================================================

    const current =
        Number(
            battery.battery_current || 0
        );


    setText(
        "modal_battery_current",
        num(
            current,
            2
        ) + " A"
    );


    // JSON belum memiliki bus_current

    setText(
        "modal_bus_current",
        num(
            current,
            2
        ) + " A"
    );


    // ==================================================
    // PACK POWER
    // ==================================================

    const packPower =
        getPackPower(
            battery
        );


    setText(
        "modal_pack_power",
        num(
            packPower,
            1
        ) + " W"
    );


    // ==================================================
    // BUS POWER
    // ==================================================

    const busPower =
        getBusPower(
            battery
        );


    setText(
        "modal_bus_power",
        num(
            busPower,
            1
        ) + " W"
    );


    // ==================================================
    // POWER DIFFERENCE
    // ==================================================

    const powerDifference =
        Math.abs(
            packPower -
            busPower
        );


    setText(
        "modal_loss_power",
        num(
            powerDifference,
            1
        ) + " W"
    );


    // ==================================================
    // LAST UPDATE
    // ==================================================

    setText(
        "last_update",
        getCurrentTime()
    );


    // ==================================================
    // CELL VOLTAGE
    // ==================================================

    renderCellVoltages(
        battery.cell_voltage || []
    );


    // ==================================================
    // ALARM
    // ==================================================

    renderAlarm(
        battery.alarm_register || {}
    );
}


// ======================================================
// CELL VOLTAGE
// ======================================================

function renderCellVoltages(cells) {

    const container =
        document.getElementById(
            "list_cell_voltage"
        );


    if (!container) {
        return;
    }


    if (
        !Array.isArray(cells) ||
        cells.length === 0
    ) {

        container.innerHTML = `

            <div class="
                col-span-full
                text-center
                text-slate-500
                py-5
            ">
                No cell data
            </div>

        `;

        return;
    }


    const max =
        Math.max(
            ...cells
        );


    const min =
        Math.min(
            ...cells
        );


    const maxIndex =
        cells.indexOf(max);


    const minIndex =
        cells.indexOf(min);


    let html = "";


    cells.forEach(
        (voltage, index) => {

            let border =
                "border-slate-700";


            let text =
                "text-slate-200";


            let label = "";


            if (
                index === maxIndex
            ) {

                border =
                    "border-green-500";

                text =
                    "text-green-400";

                label = `
                    <span class="
                        text-[9px]
                        text-green-400
                    ">
                    </span>
                `;

            }
            else if (
                index === minIndex
            ) {

                border =
                    "border-red-500";

                text =
                    "text-red-400";

                label = `
                    <span class="
                        text-[9px]
                        text-red-400
                    ">
                    </span>
                `;
            }


            html += `

                <div class="
                    bg-[#2a3a4f]
                    p-3
                    rounded
                    border-2
                    ${border}
                    flex
                    flex-col
                    items-center
                ">

                    <span class="
                        text-[12px]
                        text-slate-400
                    ">
                        Cell ${index + 1}
                    </span>


                    <span class="
                        text-sm
                        font-bold
                        ${text}
                    ">
                        ${num(
                            voltage,
                            4
                        )} V
                    </span>


                    ${label}

                </div>

            `;
        }
    );


    container.innerHTML =
        html;
}


// ======================================================
// ALARM
// ======================================================

function renderAlarm(alarm) {

    let box =
        document.getElementById(
            "battery_alarm_box"
        );


    if (!box) {

        const parent =
            document.querySelector(
                "#batteryModal .p-6.space-y-6"
            );


        if (!parent) {
            return;
        }


        box =
            document.createElement(
                "div"
            );


        box.id =
            "battery_alarm_box";


        parent.appendChild(
            box
        );
    }


    const critical1 =
        Number(
            alarm.critical1 || 0
        );


    const critical2 =
        Number(
            alarm.critical2 || 0
        );


    const major =
        Number(
            alarm.major || 0
        );


    const minor =
        Number(
            alarm.minor || 0
        );


    const total =
        critical1 +
        critical2 +
        major +
        minor;


    if (total === 0) {

        box.innerHTML = `

            <div class="
                bg-green-500/10
                border
                border-green-500/30
                rounded-lg
                p-4
                flex
                items-center
                gap-3
            ">

                <i class="
                    fas fa-check-circle
                    text-green-400
                "></i>


                <div>

                    <p class="
                        text-green-400
                        font-bold
                        text-sm
                    ">
                        No Alarm
                    </p>


                    <p class="
                        text-slate-500
                        text-xs
                    ">
                        Battery operating normally
                    </p>

                </div>

            </div>

        `;

        return;
    }


    box.innerHTML = `

        <div class="
            bg-red-500/10
            border
            border-red-500/30
            rounded-lg
            p-4
        ">

            <div class="
                flex
                items-center
                gap-2
                mb-3
            ">

                <i class="
                    fas
                    fa-triangle-exclamation
                    text-red-400
                "></i>


                <span class="
                    text-red-400
                    font-bold
                    text-sm
                ">
                    Battery Alarm
                </span>

            </div>


            <div class="
                grid
                grid-cols-2
                md:grid-cols-4
                gap-3
                text-xs
            ">


                <div>

                    <span class="text-slate-500">
                        Critical 1
                    </span>

                    <strong class="
                        block
                        text-red-400
                    ">
                        ${critical1}
                    </strong>

                </div>


                <div>

                    <span class="text-slate-500">
                        Critical 2
                    </span>

                    <strong class="
                        block
                        text-red-400
                    ">
                        ${critical2}
                    </strong>

                </div>


                <div>

                    <span class="text-slate-500">
                        Major
                    </span>

                    <strong class="
                        block
                        text-orange-400
                    ">
                        ${major}
                    </strong>

                </div>


                <div>

                    <span class="text-slate-500">
                        Minor
                    </span>

                    <strong class="
                        block
                        text-yellow-400
                    ">
                        ${minor}
                    </strong>

                </div>

            </div>

        </div>

    `;
}


// ======================================================
// DETAIL BUTTON
// ======================================================
//
// Event delegation.
// Tidak hilang walaupun card diperbarui.
//

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                ".detail-battery-btn"
            );


        if (!button) {
            return;
        }


        const slave =
            button.dataset.batterySlave;


        if (!slave) {
            return;
        }


        openBatteryModal(
            slave
        );
    }
);


// ======================================================
// ESC CLOSE MODAL
// ======================================================

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape" &&
            selectedBatterySlave !== null
        ) {

            closeBatteryModal();
        }
    }
);


// ======================================================
// LOAD BATTERY
// ======================================================

async function loadBattery() {

    // Jangan biarkan request bertumpuk

    if (isLoading) {
        return;
    }


    isLoading = true;


    // Abort request sebelumnya jika ada

    if (apiController) {

        try {
            apiController.abort();
        }
        catch (e) {}

    }


    apiController =
        new AbortController();


    // Timeout 3 detik

    const timeout =
        setTimeout(
            () => {
                apiController.abort();
            },
            3000
        );


    try {

        const response =
            await fetch(
                API_URL +
                "?_=" +
                Date.now(),
                {
                    method: "GET",
                    cache: "no-store",
                    signal:
                        apiController.signal
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        if (
            !data ||
            !Array.isArray(
                data.battery
            )
        ) {

            throw new Error(
                "Format JSON tidak sesuai"
            );
        }


        // ==================================================
        // SIMPAN DATA TERBARU
        // ==================================================

        batteryData =
            data.battery;


        // ==================================================
        // STATUS
        // ==================================================

        setStatusOnline();


        // ==================================================
        // OVERVIEW
        // ==================================================

        updateOverview(
            data
        );


        // ==================================================
        // CHECK STRUCTURE
        // ==================================================

        const newStructure =
            getBatteryStructure(
                data.battery
            );


        // ==================================================
        // RENDER CARD HANYA JIKA STRUCTURE BERUBAH
        // ==================================================

        if (
            newStructure !==
            batteryStructure
        ) {

            renderBatteryCards(
                data.battery
            );


            batteryStructure =
                newStructure;
        }


        // ==================================================
        // UPDATE CARD SETIAP DETIK
        // ==================================================

        data.battery
            .filter(
                battery =>
                    battery.online === true
            )
            .forEach(
                battery => {

                    updateBatteryCard(
                        battery
                    );

                }
            );


        // ==================================================
        // UPDATE MODAL
        // ==================================================

        if (
            selectedBatterySlave !== null
        ) {

            const selectedBattery =
                findBattery(
                    selectedBatterySlave
                );


            if (
                selectedBattery &&
                selectedBattery.online === true
            ) {

                updateModalOnly(
                    selectedBattery
                );

            }
            else {

                closeBatteryModal();

            }
        }

    }
    catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            console.warn(
                "Battery API timeout"
            );

        }
        else {

            console.error(
                "API Battery Error:",
                error
            );
        }


        setStatusOffline();

    }
    finally {

        clearTimeout(
            timeout
        );


        isLoading =
            false;
    }
}


// ======================================================
// START
// ======================================================

loadBattery();


// Refresh API setiap 1 detik

setInterval(
    loadBattery,
    1000
);
