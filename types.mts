/**
 * Defines types used by the other modules.
 */

/** 
 * The value used by the API to show that a property is not applicable in that context. 
 */
type NA = "N/A";

/** The valid values for border types. */
export type Border = `${"Canadian" | "Mexican"} Border`;
/** Port status */
export type PortStatus = "Open" | string;
/** How the API represents boolean values: `0` for `false`, `1` for `true`. */
export type BooleanAsString = "0" | "1";
/** Automation types */
export type AutomationType = "Manual" | "Bluetooth" | "RFID" | string;
/** This type can accept {@link NA} as a valid value */
type CanBeNA<T> = NA | T;
/** Operation status */
export type OperationalStatus = CanBeNA<string> | "no delay" | "delay" | "Update Pending" | "Lanes Closed";
/** This type can be null */
type Nullable<T> = T | null;
/** Valid values for hours */
type HourNumbers = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
/** Valid time values */
type Times = `${HourNumbers} ${"a" | "p"}m` | "Midnight";
/** Valid hours values */
export type Hours = '24 hrs/day' | `${Times}-${Times}`;
/** 
 * Port names. Also excepts any other string in case this type 
 * definition missed some or new ones are added later.
 */
export type PortName = "Alexandria Bay" | "Alexandria Bay, NY" | "Blaine" | "Buffalo/Niagara Falls" | "Calais" | "Champlain" | "Derby Line" | "Detroit" | "Highgate Springs" | "Houlton" | "International Falls" | "Jackman" | "Lynden" | "Madawaska" | "Massena" | "Norton" | "Ogdensburg" | "Pembina" | "Port Huron" | "Sault Ste. Marie" | "Sumas" | "Sweetgrass" | string;
/**
 * Expected crossing names. Other strings are also valid.
 */
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

/**
 * Represents a border crossing
 */
interface BorderCrossing extends BorderCrossingCommon {
    /** Date */
    date: Date;
    /** Commercial vehicle lanes */
    commercial_vehicle_lanes: CommercialVehicleLanes;
    /** Passenger vehicle lanes */
    passenger_vehicle_lanes: PassengerVehicleLanes;
    /** pedestrian lanes */
    pedestrian_lanes: PedestrianLanes;
    /** Has automation? */
    automation: boolean;
    /** Is automation enabled? */
    automation_enabled: boolean;
}



interface PortCrossing {
    /** 
     * Border wait time ID - A string containing eight-digits
     * e.g. "04070801" 
     */
    bwtId: string;
    /** e.g. "C" or "M" */
    border: "C" | "M";
    /** e.g. "Alexandria Bay" */
    portName: string;
    /** e.g. "Thousand Islands Bridge" */
    crossingName: string;
    /** e.g. "Alexandria Bay - Thousand Islands Bridge" */
    portCrossingName: number;
    /** Maximum number of commercial lanes */
    covMaximumLanes: number;
    /** Maximum number of passenger lanes */
    povMaximumLanes: number;
    /** Maximum number of pedestrian lanes */
    pedMaximumLanes: number;
    /** A unique identifier */
    id: number;
}

/**
 * The response from the port crossings API endpoint.
 */
interface PortCrossingsResponse {
    /** An array of PortCrossing objects. */
    portCrossings: [PortCrossing]
}

export type {
    BorderCrossingRaw, CommercialVehicleLanesRaw, LanesRaw,
    PassengerVehicleLanesRaw, PedestrianLanesRaw,
    BorderCrossing, CommercialVehicleLanes, Lanes,
    PassengerVehicleLanes, PedestrianLanes,
    PortCrossingsResponse, PortCrossing
}