async function loadBattery() {
    try {
        const response = await fetch("https://lifepo4mon.baharimedia.net/api/battery");
        const data = await response.json();

        // Status
        document.getElementById("status").innerText = "ONLINE";
        document.getElementById("statusLamp").className = "w-2 h-2 rounded-full bg-green-500";
        document.getElementById("status-mobile").innerText = "ONLINE";
        document.getElementById("statusLamp-mobile").className = "w-1.5 h-1.5 rounded-full bg-green-500";

        // Header
        document.getElementById("id_battery").innerText = data.slave;
        document.getElementById("manufacture").innerText = data.manufacturer;
        document.getElementById("battery_model").innerText = data.battery_model;
        document.getElementById("modal_id_battery").innerText = data.slave;
        document.getElementById("modal_manufacture").innerText = data.manufacturer;

        // Battery
        document.getElementById("soc_battery").innerText =
            data.soc + "%";

        document.getElementById("modal_soc_battery").innerText =
            data.soc + "%";

        document.getElementById("mode_battery").innerText =
            data.mode;

        document.getElementById("battery_voltage").innerText =
            data.battery_voltage.toFixed(2) + " V";

        document.getElementById("modal_battery_voltage").innerText =
            data.battery_voltage.toFixed(2) + " V";

        document.getElementById("modal_bus_voltage").innerText =
            data.bus_voltage.toFixed(2) + " V";

        document.getElementById("modal_min_cell_voltage").innerText =
            data.min_cell.toFixed(3) + " V";

        document.getElementById("modal_max_cell_voltage").innerText =
            data.max_cell.toFixed(3) + " V";

        document.getElementById("modal_diff_cell_voltage").innerText =
            data.diff_cell.toFixed(0) + " mV";

        document.getElementById("modal_battery_current").innerText =
            data.battery_current.toFixed(2) + " A";

        document.getElementById("modal_bus_current").innerText =
            data.battery_current.toFixed(2) + " A";

        document.getElementById("battery_current").innerText =
            data.battery_current.toFixed(2) + " A";

        document.getElementById("max_temp").innerText =
            data.max_temp + " °C";

        document.getElementById("min_temp").innerText =
            data.min_temp + " °C";

        document.getElementById("cycle_battery").innerText =
            data.discharge_times;

        document.getElementById("modal_cycle_battery").innerText =
            data.discharge_times;

        // Cell Voltage
        const container = document.getElementById("list_cell_voltage");
        container.innerHTML = "";

        const maxIndex = data.cell_voltage.indexOf(Math.max(...data.cell_voltage));
        const minIndex = data.cell_voltage.indexOf(Math.min(...data.cell_voltage));

        container.innerHTML = "";

        data.cell_voltage.forEach((volt, index) => {

            let border = "border-slate-700";
            let text = "";

            if (index === maxIndex) {
                border = "border-red-500";
                text = "text-red-400";
            } else if (index === minIndex) {
                border = "border-yellow-500";
                text = "text-yellow-400";
            }

            container.innerHTML += `
                <div class="bg-[#2a3a4f] p-3 rounded border-2 ${border} flex flex-col items-center">
                    <span class="text-[12px] text-slate-400">Cell ${index + 1}</span>
                    <span class="text-sm font-bold ${text}">
                        ${volt.toFixed(4)} V
                    </span>
                </div>
            `;
        });

        // Waktu update
        document.getElementById("last_update").innerText = 
            new Date().toLocaleTimeString("id-ID").replace(/\./g, ":");

        // Power
        let power = data.battery_voltage * data.battery_current;
        document.getElementById("total_power").innerText =
            power.toFixed(1) + " W";

        document.getElementById("modal_bus_power").innerText =
            power.toFixed(1) + " W";

        //Loss Power
        let loss_power = (data.battery_voltage - data.bus_voltage) * data.battery_current;
        document.getElementById("modal_loss_power").innerText =
            loss_power.toFixed(1) + " W"

        //Remaining Capacity
        const batteryCapacity = 100;
        const remainingCapacity = batteryCapacity - data.discharge_ah;

        document.getElementById("remaining_capacity").textContent =
            remainingCapacity.toFixed(2) + " Ah";

        // Battery Level (Card)
        const batteryLevel = document.getElementById("battery_level");
        batteryLevel.style.height = data.soc + "%";

        if (data.soc >= 70) {
            batteryLevel.className = "battery-fill bg-green-500";
        } else if (data.soc >= 30) {
            batteryLevel.className = "battery-fill bg-yellow-500";
        } else {
            batteryLevel.className = "battery-fill bg-red-500";
        }

        // Battery Level (Modal)
        const modalBatteryLevel = document.getElementById("modal_battery_level");
        modalBatteryLevel.style.width = data.soc + "%";

        if (data.soc >= 70) {
            modalBatteryLevel.className = "bg-blue-500 h-full";
        } else if (data.soc >= 30) {
            modalBatteryLevel.className = "bg-yellow-500 h-full";
        } else {
            modalBatteryLevel.className = "bg-red-500 h-full";
        }

    } catch (err) {

        document.getElementById("status").innerText = "OFFLINE";
        document.getElementById("statusLamp").className =
            "w-2 h-2 rounded-full bg-red-500";

        console.log(err);
    }
}

loadBattery();
setInterval(loadBattery, 1000);
