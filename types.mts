type NA = "N/A";

export type Border = `${"Canadian" | "Mexican"} Border`;
export type PortStatus = "Open" | string;
export type BooleanAsString = "0" | "1";
export type AutomationType = "Manual" | "Bluetooth" | "RFID" | string;
type CanBeNA<T> = NA | T;
export type OperationalStatus = CanBeNA<string> | "no delay" | "delay" | "Update Pending" | "Lanes Closed";
type Nullable<T> = T | null;
type HourNumbers = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
type Times = `${HourNumbers} ${"a" | "p"}m` | "Midnight";
export type Hours = '24 hrs/day' | `${Times}-${Times}`; 
export type PortName = "Alexandria Bay" | "Alexandria Bay, NY" | "Blaine" | "Buffalo/Niagara Falls" | "Calais" | "Champlain" | "Derby Line" | "Detroit" | "Highgate Springs" | "Houlton" | "International Falls" | "Jackman" | "Lynden" | "Madawaska" | "Massena" | "Norton" | "Ogdensburg" | "Pembina" | "Port Huron" | "Sault Ste. Marie" | "Sumas" | "Sweetgrass" | string;
export type CrossingName = "Ambassador Bridge" | "Bluewater Bridge" | "Derby Line I-91" | "Ferry Point" | "International Avenue" | "International Bridge - SSM" | "Lewiston Bridge" | "Milltown" | "Pacific Highway" | "Peace Arch" | "Peace Bridge" | "Point Roberts" | "Rainbow Bridge" | "Thousand Islands Bridge" | "Whirlpool Bridge" | "Windsor Tunnel" | string | null;

interface LanesCommon {
    update_time: string;
    operational_status: OperationalStatus;
}

interface LanesRaw extends LanesCommon {
    delay_minutes: string;
    lanes_open: string;
}

interface Lanes extends LanesCommon {
    delay_minutes: Nullable<number>;
    lanes_open: Nullable<number>;
}

interface BaseLanesRaw {
    maximum_lanes: string;
    standard_lanes: LanesRaw;
}

interface BaseLanes {
    maximum_lanes: Nullable<number>;
    standard_lanes: Lanes;
}

interface HasReadyLanesRaw {
    ready_lanes: LanesRaw;
}

interface HasReadyLanes {
    ready_lanes: Lanes;
}

interface CommercialVehicleLanesRaw extends BaseLanesRaw {
    cv_automation_type: AutomationType;
    cv_segment_from: string;
    cv_segment_to: string;
    cv_standard_tolerance: string;
    cv_fast_tolerance: string;
    FAST_lanes: LanesRaw;
}

interface CommercialVehicleLanes extends BaseLanes {
    cv_automation_type: AutomationType;
    cv_segment_from: string;
    cv_segment_to: string;
    cv_standard_tolerance: string;
    cv_fast_tolerance: string;
    FAST_lanes: Lanes;
}

interface PassengerVehicleLanesRaw extends BaseLanesRaw, HasReadyLanesRaw {
    pv_automation_type: AutomationType;
    pv_segment_from: string;
    pv_segment_to: string;
    pv_standard_tolerance: string;
    pv_nexus_sentri_tolerance: string;
    pv_ready_tolerance: string;
    NEXUS_SENTRI_lanes: LanesRaw;
    ready_lanes: LanesRaw;
}

interface PassengerVehicleLanes extends BaseLanes, HasReadyLanes {
    pv_automation_type: AutomationType;
    pv_segment_from: string;
    pv_segment_to: string;
    pv_standard_tolerance: string;
    pv_nexus_sentri_tolerance: string;
    pv_ready_tolerance: string;
    NEXUS_SENTRI_lanes: Lanes;
    ready_lanes: Lanes;
}


interface PedestrianLanesRaw extends BaseLanesRaw, HasReadyLanesRaw {
    ped_automation_type: AutomationType;
    ped_segment_from: string;
    ped_segment_to: string;
    ped_standard_tolerance: string;
    ped_ready_tolerance: string;
    ready_lanes: LanesRaw;
}

interface PedestrianLanes extends BaseLanes, HasReadyLanes {
    ped_automation_type: AutomationType;
    ped_segment_from: string;
    ped_segment_to: string;
    ped_standard_tolerance: string;
    ped_ready_tolerance: string;
    ready_lanes: Lanes;
}

interface BorderCrossingCommon {
    port_number: string;
    border: Border;
    port_name: PortName;
    crossing_name: CrossingName;
    hours: Hours;
    port_status: PortStatus;
    construction_notice: string;
}


interface BorderCrossingRaw extends BorderCrossingCommon {
    date: string;
    time: string;
    commercial_vehicle_lanes: CommercialVehicleLanesRaw;
    passenger_vehicle_lanes: PassengerVehicleLanesRaw;
    pedestrian_lanes: PedestrianLanesRaw;
    automation: BooleanAsString;
    automation_enabled: BooleanAsString;
}

interface BorderCrossing extends BorderCrossingCommon {
    date: Date;
    commercial_vehicle_lanes: CommercialVehicleLanes;
    passenger_vehicle_lanes: PassengerVehicleLanes;
    pedestrian_lanes: PedestrianLanes;
    automation: boolean;
    automation_enabled: boolean;
}

export type { 
    BorderCrossingRaw, CommercialVehicleLanesRaw, LanesRaw, 
    PassengerVehicleLanesRaw, PedestrianLanesRaw,
    BorderCrossing, CommercialVehicleLanes, Lanes, 
    PassengerVehicleLanes, PedestrianLanes 
}