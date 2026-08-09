const API_URL = "https://lifepo4mon.baharimedia.net/api/battery";

let batteryData = [];
let selectedBatteryIndex = null;
let isLoading = false;


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
    return Number(battery.battery_voltage || 0) *
           Number(battery.battery_current || 0);
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


// ======================================================
// CONNECTION STATUS
// ======================================================

function setStatusOnline() {

    setText("status", "ONLINE");
    setText("status-mobile", "ONLINE");

    const lamp = document.getElementById("statusLamp");
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

    const lamp = document.getElementById("statusLamp");
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
// OVERVIEW
// ======================================================

function updateOverview(data) {

    const summary = data.summary || {};

    setText(
        "overview_total_battery",
        summary.online ?? 0
    );

    setText(
        "overview_average_soc",
        num(summary.average_soc, 0)
    );

    setText(
        "overview_total_power",
        num(summary.total_power, 1)
    );

    setText(
        "overview_total_current",
        num(summary.total_current, 2)
    );

    setText(
        "api-ip",
        summary.ip ?? "-"
    );

    setText(
        "api-rssi",
        summary.rssi !== undefined
            ? summary.rssi + " dBm"
            : "-"
    );

    setText(
        "mobile-api-ip",
        summary.ip ?? "-"
    );

    setText(
        "mobile-api-rssi",
        summary.rssi !== undefined
            ? summary.rssi + " dBm"
            : "-"
    );
}


// ======================================================
// BATTERY CARD
// ======================================================

function renderBatteryCards(batteries) {

    const grid =
        document.querySelector(
            '[data-purpose="battery-grid"]'
        );

    if (!grid) {
        return;
    }


    // Hanya battery online
    const online =
        batteries
            .map((battery, index) => ({
                battery,
                index
            }))
            .filter(item =>
                item.battery.online === true
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


    online.forEach(item => {

        const battery = item.battery;
        const index = item.index;

        const soc =
            Number(battery.soc || 0);

        const power =
            getPower(battery);

        const socColor =
            getSocColor(soc);

        const modeClass =
            getModeClass(battery.mode);


        // Alarm
        const alarm =
            battery.alarm_register || {};

        const hasAlarm =
            Number(alarm.critical1 || 0) > 0 ||
            Number(alarm.critical2 || 0) > 0 ||
            Number(alarm.major || 0) > 0 ||
            Number(alarm.minor || 0) > 0;


        const border =
            hasAlarm
                ? "border-red-500/60"
                : "border-green-500/50";


        const card =
            document.createElement("div");


        card.className = `
            bg-[#1e293b]
            border-2
            ${border}
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
                        Battery #${battery.slave}
                    </h3>

                    <p class="
                        text-slate-400
                        text-[10px] md:text-xs
                    ">
                        ${battery.manufacturer || "-"}
                        ${battery.battery_model || ""}
                    </p>

                </div>


                <span class="
                    px-2
                    py-0.5
                    rounded
                    text-[9px] md:text-[10px]
                    font-bold
                    ${modeClass}
                    bg-slate-500/10
                ">
                    POWER :
                    ${num(power, 1)} W
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
                        class="
                            battery-fill
                            bg-${socColor}-500
                        "
                        style="
                            height:${Math.max(
                                0,
                                Math.min(100, soc)
                            )}%;
                        "
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


                    <div>

                        <p class="
                            text-slate-500
                            uppercase
                            font-bold
                            text-[9px] md:text-[10px]
                        ">
                            SOC
                        </p>

                        <p class="
                            text-base
                            md:text-lg
                            font-bold
                        ">
                            ${num(soc, 0)}%
                        </p>

                    </div>


                    <div>

                        <p class="
                            text-slate-500
                            uppercase
                            font-bold
                            text-[9px] md:text-[10px]
                        ">
                            Mode
                        </p>

                        <p class="
                            font-bold
                            ${modeClass}
                        ">
                            ${battery.mode || "-"}
                        </p>

                    </div>


                    <div>

                        <p class="
                            text-slate-500
                            uppercase
                            font-bold
                            text-[9px] md:text-[10px]
                        ">
                            Voltage
                        </p>

                        <p class="font-bold">
                            ${num(
                                battery.battery_voltage,
                                2
                            )} V
                        </p>

                    </div>


                    <div class="hidden md:block">

                        <p class="
                            text-slate-500
                            uppercase
                            font-bold
                            text-[10px]
                        ">
                            Temp (Max)
                        </p>

                        <p class="font-bold">
                            ${battery.max_temp ?? "-"} °C
                        </p>

                    </div>


                    <div>

                        <p class="
                            text-slate-500
                            uppercase
                            font-bold
                            text-[9px] md:text-[10px]
                        ">
                            Current
                        </p>

                        <p class="font-bold">
                            ${num(
                                battery.battery_current,
                                2
                            )} A
                        </p>

                    </div>


                    <div class="hidden md:block">

                        <p class="
                            text-slate-500
                            uppercase
                            font-bold
                            text-[10px]
                        ">
                            Temp (Min)
                        </p>

                        <p class="font-bold">
                            ${battery.min_temp ?? "-"} °C
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


                <div class="
                    ${hasAlarm
                        ? "text-red-400"
                        : "text-green-500"}
                ">

                    <span class="
                        text-[9px]
                        md:text-xs
                        font-bold
                        tracking-wider
                    ">

                        ${
                            hasAlarm
                                ? "Alarm"
                                : "Discharge Event"
                        }

                        :

                        ${
                            hasAlarm
                                ? "CHECK"
                                : battery.discharge_times
                        }

                    </span>

                </div>


                <button
                    onclick="openBatteryModal(${index})"
                    class="
                        bg-blue-600
                        hover:bg-blue-500
                        text-white
                        text-[9px] md:text-[10px]
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
                >

                    Detail

                    <i class="
                        fas fa-chevron-right
                        text-[7px] md:text-[8px]
                    "></i>

                </button>

            </div>

        `;


        grid.appendChild(card);
    });
}


// ======================================================
// MODAL
// ======================================================

function openBatteryModal(index) {

    const battery =
        batteryData[index];

    if (!battery) {
        return;
    }


    selectedBatteryIndex = index;


    // Header

    setText(
        "modal_id_battery",
        battery.slave
    );

    setText(
        "modal_manufacture",
        battery.manufacturer
    );


    // SOC

    const soc =
        Number(battery.soc || 0);


    setText(
        "modal_soc_battery",
        num(soc, 0) + "%"
    );


    const level =
        document.getElementById(
            "modal_battery_level"
        );


    if (level) {

        level.style.width =
            Math.max(
                0,
                Math.min(100, soc)
            ) + "%";


        if (soc >= 70) {

            level.className =
                "bg-blue-500 h-full";

        } else if (soc >= 30) {

            level.className =
                "bg-yellow-500 h-full";

        } else {

            level.className =
                "bg-red-500 h-full";
        }
    }


    // Remaining Capacity

    const capacity =
        Number(
            battery.battery_capacity || 0
        );

    setText(
        "modal_full_capacity",
        num(capacity, 2) + " Ah"
    );


    const remaining =
        capacity * soc / 100;


    setText(
        "remaining_capacity",
        num(remaining, 2) + " Ah"
    );


    // Cycle

    setText(
        "modal_cycle_battery",
        battery.discharge_times
    );


    // Voltage

    setText(
        "modal_battery_voltage",
        num(
            battery.battery_voltage,
            2
        ) + " V"
    );


    setText(
        "modal_bus_voltage",
        num(
            battery.battery_bus_voltage,
            2
        ) + " V"
    );


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


    // Current

    const current =
        Number(
            battery.battery_current || 0
        );


    setText(
        "modal_battery_current",
        num(current, 2) + " A"
    );


    // JSON tidak mempunyai bus current
    setText(
        "modal_bus_current",
        num(current, 2) + " A"
    );


    // Power

    const power =
        getPower(battery);


    // Pack Power

    const packPower =
        Number(battery.battery_voltage || 0) *
        Number(battery.battery_current || 0);

    setText(
        "modal_pack_power",
        num(packPower, 1) + " W"
    );


    // Bus Power
    
    const busPower =
        Number(battery.battery_bus_voltage || 0) *
        Number(battery.battery_current || 0);

    setText(
        "modal_bus_power",
        num(busPower, 1) + " W"
    );


    // Loss Power

    const voltage =
        Number(
            battery.battery_voltage || 0
        );

    const busVoltage =
        Number(
            battery.battery_bus_voltage || 0
        );


    const loss =
        (voltage - busVoltage) *
        current;


    setText(
        "modal_loss_power",
        num(loss, 1) + " W"
    );


    // Last Update

    setText(
        "last_update",
        new Date().toLocaleTimeString(
            "id-ID",
            {
                hour12: false
            }
        )
    );


    // Cell

    renderCellVoltages(
        battery.cell_voltage || []
    );


    // Alarm

    renderAlarm(
        battery.alarm_register || {}
    );


    // Open modal

    const modal =
        document.getElementById(
            "batteryModal"
        );


    if (modal) {

        modal.classList.remove("hidden");
        modal.classList.add("flex");

        document.body.classList.add(
            "overflow-hidden"
        );
    }
}


function closeBatteryModal() {

    const modal =
        document.getElementById(
            "batteryModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove("flex");
    modal.classList.add("hidden");

    document.body.classList.remove(
        "overflow-hidden"
    );


    selectedBatteryIndex = null;
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


    container.innerHTML = "";


    if (!cells.length) {

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
        Math.max(...cells);

    const min =
        Math.min(...cells);


    const maxIndex =
        cells.indexOf(max);

    const minIndex =
        cells.indexOf(min);


    cells.forEach(
        (voltage, index) => {

            let border =
                "border-slate-700";

            let text =
                "text-slate-200";

            let label = "";


            if (index === maxIndex) {

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

            } else if (index === minIndex) {

                border =
                    "border-yellow-500";

                text =
                    "text-yellow-400";

                label = `
                    <span class="
                        text-[9px]
                        text-yellow-400
                    ">
                    </span>
                `;
            }


            container.innerHTML += `

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
                        ${num(voltage, 4)} V
                    </span>

                    ${label}

                </div>

            `;
        }
    );
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
            document.createElement("div");

        box.id =
            "battery_alarm_box";


        parent.appendChild(box);
    }


    const critical1 =
        Number(alarm.critical1 || 0);

    const critical2 =
        Number(alarm.critical2 || 0);

    const major =
        Number(alarm.major || 0);

    const minor =
        Number(alarm.minor || 0);


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
                    fas fa-triangle-exclamation
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
// CLOCK
// ======================================================

function updateClock() {

    const now =
        new Date().toLocaleTimeString(
            "id-ID",
            {
                hour12: false
            }
        );


    document
        .querySelectorAll(".clock")
        .forEach(el => {

            el.innerText = now;

        });
}


updateClock();

setInterval(
    updateClock,
    1000
);


// ======================================================
// API LOAD
// ======================================================

async function loadBattery() {

    if (isLoading) {
        return;
    }


    isLoading = true;


    try {

        const response =
            await fetch(
                API_URL + "?_=" + Date.now(),
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }


        const data =
            await response.json();


        if (
            !data ||
            !Array.isArray(data.battery)
        ) {

            throw new Error(
                "Format JSON tidak sesuai"
            );
        }


        // Simpan data
        batteryData =
            data.battery;


        // Status
        setStatusOnline();


        // Overview
        updateOverview(data);


        // Battery cards
        renderBatteryCards(
            data.battery
        );


        // Jika modal sedang terbuka,
        // update battery yang sama
        if (
            selectedBatteryIndex !== null &&
            data.battery[selectedBatteryIndex]
        ) {

            updateModalOnly(
                data.battery[
                    selectedBatteryIndex
                ]
            );
        }


    } catch (error) {

        console.error(
            "API Battery Error:",
            error
        );


        setStatusOffline();


    } finally {

        isLoading = false;
    }
}


// ======================================================
// UPDATE MODAL TANPA MEMBUKA ULANG
// ======================================================

function updateModalOnly(battery) {

    if (!battery) {
        return;
    }


    const soc =
        Number(battery.soc || 0);


    setText(
        "modal_soc_battery",
        num(soc, 0) + "%"
    );


    setText(
        "modal_battery_voltage",
        num(
            battery.battery_voltage,
            2
        ) + " V"
    );


    setText(
        "modal_bus_voltage",
        num(
            battery.battery_bus_voltage,
            2
        ) + " V"
    );


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


    const current =
        Number(
            battery.battery_current || 0
        );


    setText(
        "modal_battery_current",
        num(current, 2) + " A"
    );


    setText(
        "modal_bus_current",
        num(current, 2) + " A"
    );


    const power =
        getPower(battery);


    setText(
        "modal_bus_power",
        num(power, 1) + " W"
    );


    const loss =
        (
            Number(
                battery.battery_voltage || 0
            ) -
            Number(
                battery.battery_bus_voltage || 0
            )
        ) * current;


    setText(
        "modal_loss_power",
        num(loss, 1) + " W"
    );


    setText(
        "modal_cycle_battery",
        battery.discharge_times
    );


    setText(
        "last_update",
        new Date().toLocaleTimeString(
            "id-ID",
            {
                hour12: false
            }
        )
    );


    const level =
        document.getElementById(
            "modal_battery_level"
        );


    if (level) {

        level.style.width =
            Math.max(
                0,
                Math.min(100, soc)
            ) + "%";
    }


    renderCellVoltages(
        battery.cell_voltage || []
    );


    renderAlarm(
        battery.alarm_register || {}
    );
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
