# Welcome to HVAC

Build a mobile-first web application called Welcome to HVAC.

Welcome to HVAC is a modern HVAC learning, documentation, diagnostic, and practice platform.

The product should feel like a combination of:

W3Schools-style learning structure

shadcn/ui-style documentation design

technical HVAC field reference

interactive learning platform

The site should be extremely fast and primarily use:

TEXT + DIAGRAMS + OPTIMIZED IMAGES

Do not build a generic course marketplace.

Do not build a social network.

Do not build an unnecessarily complicated 3D platform in V1.

The core product is a structured HVAC knowledge base.

1. CORE PRODUCT PHILOSOPHY

The product is:

Free HVAC Knowledge → Premium HVAC Mastery

Free users can read and explore the documentation.

Premium users get:

AI Tutor

Topic Questions

Topic Quizzes

Troubleshooting Scenarios

Equipment Scenarios

Advanced interactive visualizations

Learning/progress tracking

Pricing:

HVAC Pro

$5/month

or

$50/year

Annual pricing should communicate the $10 yearly savings.

Expert access is NOT part of V1.

Show:

Expert Help — Coming Soon

2. VERY IMPORTANT CONTENT PRINCIPLE

Do not organize the website as a collection of unrelated articles.

Every HVAC subject should be a structured knowledge object.

For example:

Gas Furnace

should connect to:

Components

Concepts

Sequence of operation

Installation

Service

Maintenance

Troubleshooting

Tools

Diagrams

Practice

Related topics

Likewise:

Capacitor

should connect to:

Motors

Compressors

Condenser fan motors

Blower motors

Electrical troubleshooting

Testing

Wiring

Practice

Related equipment

The database must support these relationships.

3. TOP-LEVEL SITE STRUCTURE

Use this primary navigation:

WELCOME TO HVAC

Start Here

HVAC Fundamentals

Equipment
├── Furnaces
├── Heat Pumps
├── Air Conditioners
├── Boilers
├── Water Heaters
├── Refrigeration
├── Thermostats & Controls
├── HRV / ERV
├── Air Handlers
├── Mini Splits
├── Chillers
├── Rooftop Units
└── Other Equipment

Components
├── Electrical Components
├── Refrigeration Components
├── Heating Components
├── Airflow Components
├── Controls
└── Hydronic Components

Installation
├── Refrigerant Piping
├── Gas Piping
├── Venting
├── Ductwork
├── Electrical
├── Condensate
├── Equipment Installation
└── Commissioning

Service & Maintenance

Troubleshooting

Tools

Building Science

Safety

Practice & Mastery

AI Tutor

Search

Experts
└── Coming Soon


The sidebar should be collapsible.

Do not put hundreds of topics directly into the primary navigation.

4. HVAC FUNDAMENTALS

Use the title:

HVAC Fundamentals

Do NOT call it "HVAC 101".

The fundamentals section should begin with:

What Is HVAC?

Heating

Ventilation

Air Conditioning

Refrigeration

How HVAC Systems Work

Types of HVAC Systems

Heat Transfer

Sensible Heat

Latent Heat

Temperature

Pressure

Energy

Work

Power

Heat Capacity

Specific Heat

Temperature Scales

Pressure Units

HVAC Units and Conversions

Airflow

CFM

Static Pressure

Velocity

Humidity

Relative Humidity

Dew Point

Moisture

Psychrometrics

Psychrometric Chart

Enthalpy

Sensible Heat Ratio

Heat Transfer

Conduction

Convection

Radiation

Refrigeration Fundamentals

Electricity Fundamentals

Gas Fundamentals

Combustion Fundamentals

Hydronic Fundamentals

Ventilation Fundamentals

Indoor Air Quality

Thermal Comfort

Building Envelope

HVAC Load Basics

Equipment Sizing Basics

HVAC System Efficiency

HVAC Terminology

HVAC Symbols

HVAC Safety

HVAC Tools

Every fundamental topic should link to more advanced topics.

5. EQUIPMENT KNOWLEDGE BASE

Create a scalable equipment database.

Initial equipment:

Heating

Gas Furnace

Electric Furnace

Oil Furnace

Heat Pump

Dual-Fuel / Hybrid Heat Pump

Boiler

Gas Boiler

Electric Boiler

Steam Boiler

Hydronic Heating

Radiant Heating

Baseboard Heating

Unit Heater

Cooling

Central Air Conditioner

Heat Pump

Ductless Mini Split

Multi-Zone Mini Split

Packaged Air Conditioner

Rooftop Unit

Evaporative Cooler

Chiller

Cooling Tower

Ventilation

HRV

ERV

Exhaust Fan

Fresh Air System

Whole-House Ventilation

Commercial Ventilation

Water Heating

Gas Water Heater

Electric Water Heater

Tankless Water Heater

Heat Pump Water Heater

Indirect Water Heater

Commercial Water Heater

Air Distribution

Air Handler

Fan Coil

Blower Assembly

VAV Box

Terminal Unit

Damper

Air Curtain

Controls

Thermostat

Smart Thermostat

Heat Pump Thermostat

Zone Control

Zoning System

Building Automation System

Advanced / Commercial

VRF / VRV

Chiller

Cooling Tower

Commercial Boiler

Commercial Rooftop Unit

Commercial Heat Pump

Geothermal Heat Pump

Ground Source Heat Pump

The admin must be able to add additional equipment without code changes.

6. EVERY EQUIPMENT PAGE MUST HAVE A STANDARD STRUCTURE

Example:

Gas Furnace

Short introduction.

What You'll Learn

How It Works

Sequence of Operation

Components

Diagram

Installation

Service

Maintenance

Troubleshooting

Common Problems

Tools

Safety

Related Topics

Then:

Practice & Mastery 🔒

Questions

Quiz

Troubleshooting Scenarios

Equipment Scenarios

Then:

AI Tutor 🔒

Ask AI about Gas Furnaces

Use the same structure across all equipment.

Sections that do not apply should be omitted rather than showing empty sections.

7. COMPONENT DATABASE

Create a complete component library.

Electrical Components

Capacitor

Run Capacitor

Start Capacitor

Dual Run Capacitor

Contactor

Relay

General Purpose Relay

Ice Cube Relay

Fan Relay

Time Delay Relay

Delay-on-Make Timer

Transformer

24V Transformer

Fuse

Circuit Breaker

Disconnect

Fused Disconnect

Non-Fused Disconnect

Switch

Limit Switch

Pressure Switch

Thermostat

Control Board

IFC / Integrated Furnace Control

Sequencer

Fan Control

Aquastat Relay

Motor

PSC Motor

ECM Motor

X13 Motor

Variable-Speed Motor

Blower Motor

Condenser Fan Motor

Compressor Motor

Refrigeration Components

Compressor

Scroll Compressor

Reciprocating Compressor

Rotary Compressor

Condenser

Evaporator

TXV

EEV

Fixed Orifice

Capillary Tube

Receiver

Accumulator

Filter Drier

Sight Glass

Solenoid Valve

Check Valve

Service Valve

Schrader Valve

Pressure Control

Defrost Board

Defrost Thermostat

Refrigerant Sensor

Heating Components

Gas Valve

Ignitor

Hot Surface Ignitor

Spark Ignition

Flame Sensor

Flame Rectification System

Thermocouple

Thermopile

Powerpile

Inducer Motor

Pressure Switch

Heat Exchanger

Burner

Fan Limit Control

Rollout Switch

High Limit Switch

Hydronic Components

Circulator

Aquastat

Zone Valve

Expansion Tank

Pressure Relief Valve

Mixing Valve

Air Separator

Air Vent

Boiler Feed Components

Pump

Ventilation Components

HRV Core

ERV Core

Supply Fan

Exhaust Fan

Damper

Defrost Control

Filters

Sensors

8. ELECTRICAL & COMPONENT DIAGNOSTICS

Create a dedicated electrical diagnostic section.

The following requested subjects must be represented as original HVAC educational content.

Capacitors

Create topics covering:

What Is a Capacitor?

Run Capacitors

Start Capacitors

Dual Run Capacitors

Capacitor Ratings

MFD / µF

Voltage Rating

Identifying Capacitor Terminals

Reading Capacitor Labels

Testing Capacitors

Visual Capacitor Inspection

Measuring Capacitance

Capacitor Failure Modes

Capacitor Troubleshooting

Capacitor Replacement Considerations

Capacitors and Motors

Capacitors and Compressors

Common Capacitor Mistakes

Include the concept:

Two Capacitors Used to Increase Capacitance

but teach it as an electrical concept and explain that field modifications or substitutions must follow equipment requirements and applicable safety procedures.

Do not instruct users to perform unsafe improvised repairs merely to get equipment running.

Relays

Create:

What Is a Relay?

General Purpose Relay

HVAC Fan Relay

Ice Cube Relay

Relay Contacts

Normally Open

Normally Closed

Coil

Contact Ratings

Relay Testing

Relay Failure

Burned Contacts

Relay Troubleshooting

Relay Replacement

Relay Wiring Concepts

Include the requested concept:

Testing a Bad General Purpose Relay and Identifying Burn Marks

Teach visual inspection and safe testing rather than reproducing another creator's procedure.

Contactors

Create:

What Is a Contactor?

HVAC Contactors

Coil

Line Side

Load Side

Contact Ratings

Single-Pole Contactors

Two-Pole Contactors

Three-Pole Contactors

Contactor Testing

Contactor Failure

Burned Contacts

Welded Contacts

Chattering Contactors

Contactor Troubleshooting

Contactor Replacement

Transformers

Create:

What Is an HVAC Transformer?

120/208/240V to 24V Transformers

VA Rating

Primary Side

Secondary Side

Transformer Testing

Transformer Failure

Blown 24V Fuse

Shorted Control Circuit

Transformer Replacement

Selecting a Replacement Transformer

Include:

How to Select an Appropriate HVAC 24V Transformer Replacement

Do not claim that one transformer works with "almost every unit." Explain that voltage, VA capacity, control configuration, and equipment requirements must be verified.

9. MOTORS

Create a dedicated motor diagnostics section.

Topics:

Motor Fundamentals

PSC Motors

ECM Motors

X13 Motors

Variable-Speed Motors

Single-Phase Motors

Blower Motors

Condenser Fan Motors

Inducer Motors

Motor Windings

Resistance Testing

Insulation Testing

Thermal Overload

Bearings

Capacitors

Motor Current

Locked Rotor

Motor Failure

Motor Troubleshooting

Motor Replacement

Create detailed educational topics based on these requested subjects:

Step-by-Step Blower Motor Troubleshooting

Outdoor Condenser Fan Motor Troubleshooting

Variable-Speed Blower Motor Troubleshooting

X13 Blower Motor Troubleshooting

Variable-Speed Fan Motor Troubleshooting

240V Single-Phase Blower Motor Troubleshooting

3-Speed Single-Phase Blower Motor Troubleshooting

Blower Motor Not Starting

Blower Motor Running Continuously

Blower Motor Resistance Testing

Blower Motor Thermal Overload

Top Causes of Blower Motor Failure

Do not provide unsafe instructions for working on energized equipment.

10. COMPRESSORS

Create:

Compressor Fundamentals

Compressor Types

Scroll Compressor

Reciprocating Compressor

Compressor Electrical Terminals

Common / Start / Run

Compressor Resistance Testing

Compressor Ground Fault

Open Winding

Shorted Winding

Locked Rotor

Compressor Current

Compressor Valves

Compressor Mechanical Failure

Compressor Overheating

Compressor Troubleshooting

Compressor Replacement

Include:

How to Test / Ohm a Compressor

Teach the diagnostic principle and safety requirements.

11. ELECTRICAL TROUBLESHOOTING SCENARIOS

Create dedicated scenarios:

Outdoor AC Unit Not Turning On

Contactor Not Energizing

No 24V Control Voltage

Blown 24V Fuse

Thermostat Not Calling

Fan Relay Failure

Ice Cube Relay Failure

Blower Not Running

Blower Runs Continuously

Condenser Fan Not Running

Compressor Not Starting

Capacitor Failure

Transformer Failure

Motor Failure

Control Board Failure

Disconnect Problem

Fuse Problem

Open Control Circuit

Each scenario should follow:

SYMPTOM

What the technician observes

POSSIBLE CAUSES

Diagnostic path

MEASUREMENTS / OBSERVATIONS

Interpretation

LIKELY CAUSES

Next diagnostic step

SAFETY NOTE

RELATED TOPICS


12. GAS FURNACES

Create a deep gas furnace knowledge base.

Topics:

Gas Furnace Fundamentals

Gas Furnace Components

Sequence of Operation

Ignition Sequence

Thermostat Call

Control Board

Inducer

Pressure Switch

Ignitor

Gas Valve

Burner

Flame Sensor

Flame Rectification

Heat Exchanger

Limit Switch

Rollout Switch

Blower

Fan Limit Control

Condensate

Venting

Combustion Air

Gas Pressure

Combustion

Flue Gas

Carbon Monoxide

Furnace Installation

Furnace Service

Furnace Maintenance

Furnace Troubleshooting

Specific requested topics:

Gas Furnace Sequence of Operation

Pressure Switch Troubleshooting

Inducer Motor Troubleshooting

Hot Surface Ignitor Testing

Flame Sensor Testing

Flame Rectification

Thermostat/Furnace Diagnostic Testing

Furnace Pressure Switch Testing

Condensate Drain Problems

Control Board Troubleshooting

Spark Ignition Control

Mercury Flame Sensor Concepts

Smart Gas Valve Troubleshooting

Direct Ignition Gas Valve Troubleshooting

Millivolt Gas Valve

Thermopile

750 mV Systems

Oil Burner Ignition Transformer

Oil Burner Electrode Troubleshooting

Fan Limit Control

Furnace Error Codes

Furnace Sequence-Based Troubleshooting

When discussing thermostat bypass/testing, explain the electrical/control principle and safe diagnostic context. Do not encourage unsafe bypassing or defeating safety controls.

13. HEAT PUMPS

Create:

Heat Pump Fundamentals

Air Source Heat Pump

Cold Climate Heat Pump

Ducted Heat Pump

Mini Split Heat Pump

Geothermal Heat Pump

Dual Fuel

Reversing Valve

Defrost

Defrost Board

Defrost Thermostat

Outdoor Coil

Indoor Coil

Auxiliary Heat

Emergency Heat

Heat Pump Thermostat

Heat Pump Electrical System

Heat Pump Refrigeration Cycle

Heat Pump Charging

Heat Pump Service

Heat Pump Maintenance

Heat Pump Troubleshooting

Specific requested topics:

Heat Pump Troubleshooting

Testing a Defrost Board

Defrost Thermostat Sensor Testing

Defrost Control Troubleshooting

Heat Pump Thermostat Troubleshooting

Defrost System Diagnosis

Cooling/Heating Mode Diagnostic Concepts

Do not teach defeating safety controls as a normal repair method.

14. AIR CONDITIONERS

Create:

Air Conditioner Fundamentals

Central AC

Packaged AC

Rooftop AC

Mini Split AC

Condenser

Evaporator

Compressor

Condenser Fan

Metering Device

Refrigerant Circuit

Airflow

Condensate

Electrical Controls

Thermostat

Service

Maintenance

Troubleshooting

Specific diagnostic scenarios:

AC Not Turning On

No Airflow

Wet Evaporator Coil

Frozen Coil

Noisy Outdoor Unit

Low Airflow

Refrigerant Charge Problems

Electrical Problems

Contactor Problems

Capacitor Problems

Compressor Problems

Refrigerant Restrictions

TXV Problems

15. REFRIGERATION

Create a comprehensive refrigeration section.

Topics:

Refrigeration Fundamentals

Refrigeration Cycle

Vapor Compression

Compressor

Condenser

Expansion Device

Evaporator

Refrigerant

Refrigerant Properties

Pressure/Temperature Relationship

Saturation

Superheat

Subcooling

Enthalpy

Refrigerant Charging

Charging by Weight

Superheat Charging

Subcooling Charging

Checking Charge

Refrigerant Recovery

Pump Down

Evacuation

Vacuum

Microns

Leak Detection

Electronic Leak Detection

Ultrasonic Leak Detection

Nitrogen Pressure Testing

Service Valves

Schrader Valves

TXV

EEV

Fixed Orifice

Restriction Diagnosis

Compressor Valve Diagnosis

Low Charge

Overcharge

Low Airflow

Bad TXV

Refrigerant Restriction

Specific requested diagnostic concepts:

Low Charge vs Bad TXV

High Superheat / Low Pressure

Low Superheat / High Pressure

TXV Bulb Diagnosis

TXV Troubleshooting

Liquid-Line Restriction

Low Airflow vs Refrigerant Problem

Compressor Valve Diagnosis

Refrigerant Gauge Diagnosis

Refrigerant Gauge Adjustment/Inspection

Schrader Valve Leakage

Electronic Leak Detection

Do not provide illegal or unsafe refrigerant handling instructions.

Include appropriate refrigerant handling and recovery warnings.

16. REFRIGERANT CHARGING

Create individual topics:

Refrigerant Charging

Charging by Weight

Charging by Superheat

Charging by Subcooling

Checking Refrigerant Charge

Reading Gauge Pressures

Saturation Temperature

Superheat

Subcooling

Charging Fixed-Orifice Systems

Charging TXV Systems

Heat Pump Charging

Low Charge Symptoms

Overcharge Symptoms

Restriction Symptoms

Low Airflow vs Low Charge

Refrigerant Diagnostic Workflow

Include:

R-22 concepts

R-410A concepts

But explain that refrigerant practices, equipment specifications, and regulations change over time and must be verified against current equipment documentation and applicable regulations.

Do not present historical refrigerants as interchangeable.

17. LEAK DETECTION & PRESSURE TESTING

Create:

Refrigerant Leak Fundamentals

Leak Locations

Schrader Valve Leak

Brazed Joint Leak

Flare Connection Leak

Coil Leak

Electronic Leak Detector

Ultrasonic Leak Detection

Bubble Testing

Pressure Testing

Nitrogen Testing

Leak Repair

Verification After Repair

Specific topics:

Finding a Refrigerant Leak

Electronic Leak Detector

Schrader Valve Replacement Concepts

Leak Verification

18. THERMOSTATS

Create:

Thermostat Fundamentals

Mechanical Thermostats

Digital Thermostats

Smart Thermostats

Heat Pump Thermostats

Multi-Stage Thermostats

24V Controls

R

C

Y

G

W

O/B

AUX

E

Thermostat Wiring

Thermostat Troubleshooting

Blank Thermostat

Blown 24V Fuse

Incorrect Wiring

Bad Thermostat

Thermostat Testing

Heat Pump Thermostat Testing

Remote Bulb Controls

SPDT Controls

Specific requested concepts:

How to Test a Thermostat

Thermostat Not Working

Blank Thermostat

Thermostat/Furnace/AC Not Working

Thermostat Wiring Problems

Heat Pump Thermostat Troubleshooting

Remote Bulb Temperature Control

Teach control-system diagnostics safely.

19. BOILERS & HYDRONICS

Create:

Boiler Fundamentals

Gas Boiler

Electric Boiler

Steam Boiler

Hot Water Boiler

Condensing Boiler

Boiler Sequence

Burner

Heat Exchanger

Circulator

Expansion Tank

Pressure Relief Valve

Aquastat

Aquastat Relay

Zone Valve

Mixing Valve

Hydronic Piping

Water Pressure

Water Temperature

Flow

Air Elimination

Boiler Controls

Boiler Maintenance

Boiler Service

Boiler Troubleshooting

Specific:

Boiler Aquastat Relay Troubleshooting

Boiler Control Wiring Concepts

Boiler Troubleshooting

20. WATER HEATERS

Create:

Gas Water Heater

Electric Water Heater

Tankless Water Heater

Heat Pump Water Heater

Indirect Water Heater

Components

Burners

Heating Elements

Thermostats

Gas Controls

T&P Relief Valve

Expansion Tank

Anode Rod

Venting

Combustion Air

Water Connections

Installation

Service

Maintenance

Troubleshooting

21. HRV / ERV

Create:

Ventilation Fundamentals

HRV

ERV

HRV vs ERV

Heat Recovery

Energy Recovery

Supply Air

Exhaust Air

Outdoor Air

Fresh Air

Ventilation Rates

Balancing

Filters

Defrost

Condensation

Installation

Service

Maintenance

Troubleshooting

Indoor Air Quality

22. VENTING, CHIMNEYS & COMBUSTION AIR

Create a dedicated major section.

Topics:

Combustion

Complete Combustion

Incomplete Combustion

Combustion Air

Ventilation Air

Dilution Air

Flue Gas

Draft

Natural Draft

Induced Draft

Power Venting

Direct Vent

Sealed Combustion

Chimneys

Flue Pipes

Vent Materials

Vent Sizing

Common Venting

Vent Termination

Vent Termination Location

Termination Clearances

Condensing Appliance Venting

Category I

Category II

Category III

Category IV

Backdrafting

Carbon Monoxide

Combustion Analysis

This section must NEVER present one jurisdiction's code as universal.

Every applicable page should display:

Local Code Notice

"HVAC installation, venting, combustion air, ventilation air, gas piping, clearances, termination locations, electrical requirements, permits, and equipment requirements vary by jurisdiction and equipment. Always verify the applicable local codes, adopted code edition, regulations, permits, and manufacturer installation instructions before installation or service."

23. GAS PIPING

Create:

Natural Gas

Propane

Gas Pressure

Gas Regulators

Gas Piping

Pipe Materials

Pipe Sizing Concepts

Gas Load

Pressure Drop

Gas Valves

Shutoff Valves

Gas Connectors

Leak Testing

Combustion

Gas Furnace

Gas Boiler

Gas Water Heater

Again, do not provide jurisdiction-specific requirements as universal.

24. AIRFLOW & DUCTWORK

Create:

Airflow Fundamentals

CFM

Static Pressure

Total External Static Pressure

Supply Air

Return Air

Filter Pressure Drop

Blower Performance

Fan Laws

Ductwork

Flexible Duct

Sheet Metal Duct

Duct Sizing

Duct Design

Duct Leakage

Duct Sealing

Insulation

Dampers

Registers

Grilles

Diffusers

Air Balancing

Testing and Balancing

Noise

Comfort

Airflow Troubleshooting

Also introduce residential HVAC design concepts such as:

Load Calculation

Equipment Selection

Duct Design

Zoning

Air Distribution

Clearly identify that detailed design standards such as ACCA Manual J, D and S are standards/reference frameworks and should not be reproduced from copyrighted publications.

25. BUILDING SCIENCE

Create:

Building Envelope

Insulation

Air Sealing

Thermal Bridging

Moisture

Condensation

Humidity

Indoor Air Quality

Air Leakage

Infiltration

Exfiltration

Weatherization

Attic Insulation

Wall Insulation

Basement

Crawlspace

Windows

Doors

Blower Door Testing

Thermal Imaging

Energy Auditing

Comfort Problems

26. INSTALLATION

Create installation knowledge for:

Furnace

Heat Pump

Air Conditioner

Mini Split

Boiler

Water Heater

HRV

ERV

Thermostat

Air Handler

Ductwork

Refrigerant Piping

Copper Tubing

Swaging

Flaring

Brazing

Nitrogen During Brazing

Pressure Testing

Evacuation

Condensate Drain

Gas Piping

Venting

Vent Termination

Electrical Connections

Startup

Commissioning

Performance Verification

Include installation safety and local-code notices.

27. SERVICE & MAINTENANCE

Create:

Preventive Maintenance

Seasonal Maintenance

Inspection

Electrical Inspection

Refrigerant Inspection

Airflow Inspection

Filter Service

Coil Cleaning

Condensate Drain Service

Motor Inspection

Blower Cleaning

Combustion Testing

Gas Testing

Leak Testing

Recovery

Evacuation

Charging

Commissioning

Documentation

Performance Verification

28. TOOLS

Create a searchable tool database:

Multimeter

Clamp Meter

Manometer

Digital Manometer

Refrigerant Gauge Set

Digital Manifold

SMAN460

Vacuum Pump

Micron Gauge

Recovery Machine

Recovery Cylinder

Refrigerant Scale

Leak Detector

Ultrasonic Leak Detector

Thermometer

Temperature Probes

Psychrometer

Combustion Analyzer

Static Pressure Kit

Nitrogen Regulator

Flaring Tool

Swaging Tool

Brazing Equipment

Tubing Cutter

Hand Tools

PPE

Each tool page:

What it is

What it measures

Where it is used

Related HVAC equipment

Basic safe use

Common mistakes

Related procedures

Related troubleshooting

29. TROUBLESHOOTING KNOWLEDGE MODEL

Do not make troubleshooting just another article category.

It must be structured.

Every troubleshooting article should support:

SYMPTOM

WHAT YOU OBSERVE

POSSIBLE CAUSES

WHAT TO CHECK

MEASUREMENT / TEST

WHAT THE RESULT MEANS

LIKELY CAUSE

NEXT STEP

SAFETY NOTE

RELATED TOPICS


Example:

Outdoor AC Not Running

Possible causes:

Thermostat/control call

24V issue

Disconnect

Fuse/breaker

Contactor

Capacitor

Control board

Compressor

Condenser fan

Wiring

Do not teach a one-cause diagnosis for a symptom that can have many causes.

30. PRACTICE & MASTERY

Practice is PREMIUM.

Every equipment, component, concept, installation procedure, service procedure, and troubleshooting topic should be able to contain:

Practice & Mastery 🔒

Questions
Quiz
Troubleshooting Scenarios
Equipment Scenarios


Examples:

Capacitor

Questions
Quiz
Capacitor Troubleshooting Scenarios
Motor Equipment Scenarios

Gas Furnace

Questions
Quiz
Gas Furnace Troubleshooting Scenarios
Gas Furnace Equipment Scenarios

Superheat

Questions
Quiz
Superheat Diagnostic Scenarios
Refrigeration Equipment Scenarios

Static Pressure

Questions
Quiz
Airflow Troubleshooting Scenarios
Equipment Scenarios

31. QUESTION TYPES

Support:

Multiple Choice

True/False

Multiple Select

Short Answer

Calculation

Diagnostic Decision

Identify the Component

Identify the Problem

Sequence of Operation

Questions should include explanations.

Do not only tell the user whether they are correct.

Explain why.

32. TROUBLESHOOTING SCENARIOS

Create realistic technician-style scenarios.

Example:

You arrive at a house.

The thermostat is calling for cooling.

The indoor blower is running.

The outdoor condenser is not running.

What would you check first?


Then provide branching decisions.

Example:

Check control voltage.

Result:
24V is present.

What does this tell you?

[Continue]


The goal is to teach diagnostic thinking.

33. EQUIPMENT SCENARIOS

Create realistic equipment situations.

Example:

Gas Furnace Scenario

Symptoms:

Thermostat calls for heat

Inducer starts

Ignitor glows

Gas valve opens

Burner lights

Burner shuts down shortly afterward

Ask the learner to reason through possible causes.

Do NOT make every scenario a simple "replace this part" question.

34. AI TUTOR

AI Tutor is PREMIUM.

The AI must be grounded in the Welcome to HVAC knowledge base.

The AI should know the current topic.

Examples:

On:

/equipment/gas-furnace

show:

Ask AI about Gas Furnaces

On:

/concepts/superheat

show:

Ask AI about Superheat

Quick prompts:

Explain this simply

Give me an example

Go deeper

Quiz me

Give me a troubleshooting scenario

Explain this like an apprentice

Compare two concepts

Help me diagnose this scenario

The AI must not pretend to know local code requirements.

For code-sensitive questions:

"Requirements vary by jurisdiction and manufacturer. Verify the applicable local code and installation instructions."

35. CONTENT GENERATION REQUIREMENT

The application must be seeded with original starter content for the topics listed in this specification.

Do not simply create empty pages.

Each seeded topic should contain a useful introductory explanation.

For important concepts, create:

Definition

Why it matters

How it works

Components

Diagnostic relevance

Common problems

Related topics

Safety note where applicable

However, do NOT generate unsafe or overconfident field procedures.

For high-risk topics such as:

Gas

Combustion

Electrical

Refrigerants

High pressure

Brazing

Nitrogen

Carbon monoxide

Live electrical testing

the content must emphasize appropriate training, PPE, lockout/tagout where applicable, manufacturer instructions, and local requirements.

36. IMPORTANT CONTENT SAFETY RULE

Some requested topics refer to techniques such as:

bypassing thermostat controls

forcing defrost

bypassing controls

emergency capacitor arrangements

working on energized equipment

Do not present bypassing or defeating safety controls as normal repair procedures.

Where such concepts are educationally relevant:

Explain what the control does.

Explain the diagnostic principle.

Explain why a technician might isolate a control during a controlled diagnostic test.

Emphasize manufacturer procedures and safety.

Never encourage defeating a safety device to leave equipment operating.

The educational goal is understanding and diagnosis, not unsafe field improvisation.

37. CONTENT SOURCE POLICY

Use established HVAC organizations and technical references to understand the scope and terminology of the field.

Useful reference sources include:

ASHRAE

ACCA

EPA

U.S. Department of Energy

OSHA

ESCO Institute

Manufacturer technical documentation

Relevant educational/training resources

Do NOT scrape or reproduce copyrighted articles, books, manuals, course material, or YouTube transcripts.

Create original Welcome to HVAC explanations.

Where appropriate, store an internal:

source_reference
source_name
source_url


for editorial review.

Do not display copied source material as Welcome to HVAC content.

38. ADMIN CONTENT MANAGEMENT SYSTEM

Create:

/admin

Admin navigation:

Dashboard

Content
├── All Content
├── Equipment
├── Components
├── Concepts
├── Procedures
├── Troubleshooting
└── Tools

Practice
├── Questions
├── Quizzes
├── Troubleshooting Scenarios
└── Equipment Scenarios

Media

Categories

Users

Subscriptions

Settings


Admin must be able to:

Create

Edit

Draft

Preview

Publish

Archive

Search

Categorize

Tag

Relate

Add images

Add diagrams

Add practice

Add safety notes

Add code notices

No code changes should be required to add a new HVAC concept.

39. CONTENT EDITOR

Use a clean documentation editor.

Support:

H1/H2/H3

Paragraph

Lists

Tables

Images

Captions

Links

Related topic blocks

Warning blocks

Safety blocks

Code notices

Technician tips

Definitions

Formulas

Diagrams

Create reusable callouts:

Note

Safety

Technician Tip

Important

Local Code Notice

40. CONTENT RELATIONSHIPS

Create relationships between:

Equipment

Components

Concepts

Procedures

Tools

Troubleshooting

Practice

Examples:

Gas Furnace
→ Inducer Motor
→ Pressure Switch
→ Condensate
→ Ignitor
→ Flame Sensor
→ Gas Valve
→ Control Board
→ Blower Motor
→ Venting
→ Combustion Air


Another:

Heat Pump
→ Compressor
→ Reversing Valve
→ Defrost Board
→ Defrost Sensor
→ Outdoor Fan
→ Thermostat
→ Refrigerant Charging
→ Superheat
→ Subcooling


Another:

Capacitor
→ PSC Motor
→ Condenser Fan
→ Blower Motor
→ Compressor
→ Electrical Troubleshooting


Relationships should automatically appear on relevant pages.

41. SEARCH

Search should be one of the most important parts of the application.

Use a command-palette/documentation-style search.

Search:

Equipment

Components

Concepts

Procedures

Troubleshooting

Tools

Questions

Diagrams

Example:

Search:

pressure switch

Results:

Furnace Pressure Switch

Pressure Switch Troubleshooting

Inducer Motor

Gas Furnace

Condensate Drain

Furnace Sequence of Operation

Support fuzzy matching.

42. URL STRUCTURE

Use clean URLs.

Examples:

/hvac-fundamentals
/equipment/gas-furnace
/equipment/heat-pump
/equipment/boiler
/equipment/water-heater
/components/capacitor
/components/contactor
/components/relay
/components/transformer
/components/blower-motor
/concepts/superheat
/concepts/subcooling
/concepts/static-pressure
/procedures/refrigerant-charging
/troubleshooting/gas-furnace
/tools/manometer
/tools/sman460


43. DIAGRAMS

Use diagrams heavily.

Important diagrams:

Basic HVAC system

Refrigeration cycle

Gas furnace sequence

Heat pump cycle

Air conditioner cycle

Electrical control circuit

24V thermostat circuit

Furnace wiring concept

Capacitor terminals

Contactor

Relay

Transformer

Blower motor

Gas furnace components

Boiler system

Hydronic loop

HRV airflow

ERV airflow

Duct system

Venting system

Diagrams should be clean, simple, and educational.

Whenever possible, allow users to click a component and open its explanation.

44. INTERACTIVE VISUALIZATION

V1 should prioritize lightweight interactive visualizations over complex 3D.

Examples:

Refrigeration Cycle

Click:

Compressor → Condenser → Metering Device → Evaporator

Show:

pressure concept

temperature concept

state change

heat movement

Gas Furnace

Animate:

Thermostat call
→ Control board
→ Inducer
→ Pressure switch
→ Ignition
→ Gas valve
→ Flame
→ Blower
→ Heat delivery

Heat Pump

Show:

Cooling mode

Heating mode

Reversing valve changes the refrigerant flow direction.

Electrical

Show:

24V control circuit

and:

Line voltage circuit

Keep these educational rather than pretending they are universal wiring diagrams.

45. MOBILE-FIRST DESIGN

The majority of pages must work extremely well on phones.

Mobile navigation:

Top bar:

☰
Welcome to HVAC
🔍


Documentation pages:

Breadcrumbs

Title

Description

Content

Diagram

Related Topics

Practice

AI Tutor

Avoid extremely wide tables.

Make diagrams horizontally scrollable where necessary.

46. DESKTOP DESIGN

Desktop:

┌───────────────────────────────────────────────┐
│ Welcome to HVAC       Search       Account    │
├───────────────┬───────────────────────────────┤
│ Documentation │                               │
│               │        Main Content            │
│ Fundamentals  │                               │
│ Equipment     │                               │
│ Components    │                               │
│ Installation  │                               │
│ Troubleshoot  │                               │
│ Tools         │                               │
│               │                               │
└───────────────┴───────────────────────────────┘


Use a right-side "On this page" navigation on large screens when useful.

47. SHADCN-STYLE DESIGN

The visual language should be inspired by shadcn/ui documentation.

Use:

neutral backgrounds

subtle borders

strong typography

excellent spacing

simple buttons

restrained rounded corners

minimal shadows

responsive sidebars

code/documentation-style navigation

command-palette search

clean tabs

accessible dialogs

dark mode

light mode

Avoid:

excessive gradients

giant hero illustrations

excessive cards

stock photos everywhere

flashy animations

gamification-heavy UI

48. HOME PAGE

Keep the home page simple.

Hero:

Welcome to HVAC

Learn HVAC. Understand how it works. Practice what you learn.

Search:

Search HVAC...

Then:

Start Learning

HVAC Fundamentals

Explore Equipment

Furnaces
Heat Pumps
Air Conditioners
Boilers
Water Heaters
HRV / ERV
Refrigeration

Practice & Mastery

Questions
Quizzes
Troubleshooting
Equipment Scenarios

Then a simple HVAC Pro section:

HVAC Pro

$5/month

or

$50/year

AI Tutor

Topic Practice

Troubleshooting Scenarios

Equipment Scenarios

Advanced Interactive Learning

49. PERFORMANCE

The website should be fast.

Prioritize:

server-side or optimized content loading

lazy-loaded images

compressed images

minimal JavaScript on documentation pages

code splitting

lightweight diagrams

caching

responsive images

no unnecessary heavy dependencies

Text pages should load extremely quickly.

50. DATABASE ARCHITECTURE

Do NOT hard-code every page.

Use structured database records.

Example:

content

id
title
slug
content_type
category
subcategory
description
body
difficulty
status
featured_image
tags
safety_note
code_notice
created_at
updated_at


Relationships:

content_relationships

content_id
related_content_id
relationship_type


Practice:

practice_questions

practice_quizzes

troubleshooting_scenarios

equipment_scenarios


Media:

media

id
content_id
type
url
alt_text
caption


The architecture must support thousands of content objects.

51. CONTENT STATUS

Every content item should support:

Draft

Published

Archived

Admin should be able to preview draft content before publishing.

52. PREMIUM ACCESS

Create an entitlement system.

Free:

Documentation

Search

Diagrams

Basic interactive visualizations

Premium:

AI Tutor

Questions

Quizzes

Troubleshooting Scenarios

Equipment Scenarios

Advanced interactive features

Progress tracking

Do not hide the existence of premium features.

Show locked previews.

53. SUBSCRIPTION STRUCTURE

Create:

HVAC Pro Monthly
$5/month

HVAC Pro Annual
$50/year


Do not implement complicated pricing tiers.

Keep one premium plan.

54. ADMIN CONTENT SEEDING

When the application is first created, preload a large structured taxonomy.

Do not create hundreds of disconnected blank pages.

Create meaningful starter content for the major concepts.

For the extensive requested topics, create records with:

Title

Description

Category

Related equipment

Related components

Related tools

Starter educational content

Troubleshooting relevance

Safety notes where needed

Practice placeholders or starter questions

The admin can then expand the content.

55. DO NOT COPY USER-PROVIDED VIDEO TITLES AS ARTICLE TITLES

The user-provided lists represent topics that need to be covered, not content that should be copied.

Transform them into professional Welcome to HVAC topics.

For example:

Instead of:

"How to tell if an AC Capacitor is Bad! Visual and Multimeter Testing!"

use:

HVAC Capacitor Testing

Subtopics:

Visual Inspection

Capacitance Testing

MFD / µF Rating

Voltage Rating

Common Failure Modes

Troubleshooting

Instead of:

"Why is My Outdoor Air Conditioner so Noisy! Explained!"

use:

Noisy Outdoor Condenser

Subtopics:

Fan Problems

Motor Problems

Loose Components

Compressor Noise

Vibration

Electrical Causes

Refrigeration-Related Causes

Instead of:

"Gas Furnace Won't Ignite!"

use:

Gas Furnace Ignition Troubleshooting

Subtopics:

Ignition sequence

Ignitor

Flame sensor

Gas valve

Control board

Pressure switch

Combustion

Diagnostic sequence

Use professional documentation titles throughout the site.

56. COMPLETE REQUESTED DIAGNOSTIC TOPIC INVENTORY

Make sure the database contains coverage for the following requested areas.

Electrical

Capacitor Testing

Dual Capacitor Identification

MFD / µF Testing

Start Capacitor

Run Capacitor

Relay Testing

Burned Relay Contacts

Contactors

Contactor Wiring Concepts

Contactor Troubleshooting

Contactor Ratings

Delay-on-Make Timers

24V Transformers

Transformer Selection

Blower Motor Troubleshooting

Outdoor Fan Motor Troubleshooting

Variable-Speed Motor Troubleshooting

X13 Motor Troubleshooting

ECM Motor Troubleshooting

Compressor Resistance Testing

240V Blower Motor Diagnostics

Blower Motor Continuous Operation

AC Unit Not Turning On

Electrical Disconnects

Fused Disconnect

Non-Fused Disconnect

Fan Relay

Ice Cube Relay

Condensate Pump

Control Board

Fan Control

Aquastat Relay

Gas Furnace

Sequence of Operation

Pressure Switch

Inducer

Ignitor

Flame Sensor

Flame Rectification

Control Board

Spark Ignition

Gas Valve

Smart Gas Valve

Thermopile

Millivolt Gas Valve

Condensate Drain

Error Codes

Fan Limit

Oil Burner Ignition

Furnace Troubleshooting

Heat Pump / AC

Compressor Diagnosis

Airflow Problems

Wet Coil

Frozen Coil

Noisy Condenser

Defrost Board

Defrost Sensor

Heat Pump Thermostat

Refrigerant Charge

Electrical Diagnosis

No Cooling

No Heating

Outdoor Unit Failure

Refrigeration

Gauge Diagnosis

R-22 Concepts

R-410A Concepts

Low Charge

Overcharge

Bad TXV

Refrigerant Restriction

Superheat

Subcooling

TXV Bulb

Compressor Valve Problems

Leak Detection

Schrader Valve

Electronic Leak Detector

Pressure Testing

Refrigerant Recovery

Vacuum

Charging

Thermostats

Thermostat Testing

Thermostat Wiring

Blank Thermostat

Blown 24V Fuse

Heat Pump Thermostat

Remote Bulb Thermostat

SPDT Controls

Control Diagnosis

57. CONTENT QUALITY STANDARD

Every major article should answer:

What is it?

Why does it matter?

Where is it used?

How does it work?

What can go wrong?

How is it diagnosed?

What tools are relevant?

What related equipment uses it?

What safety issues matter?

What should the learner practice?

Use clear language.

Start simple.

Then progressively go deeper.

A beginner should be able to understand the first part.

An apprentice/technician should find useful diagnostic information deeper in the article.

58. LEARNING LEVELS

Tag content with:

Beginner

Apprentice

Technician

Advanced

Users should be able to filter content by level.

59. RELATED TOPICS

Every page should automatically show:

Related Equipment

Related Components

Related Concepts

Related Tools

Related Troubleshooting

Related Practice

This is essential.

60. FINAL PRODUCT GOAL

The finished V1 should feel like:

"W3Schools for HVAC, with modern technical documentation and technician-focused practice."

Not:

"an HVAC blog."

Not:

"an online course marketplace."

Not:

"an AI chatbot."

The documentation is the foundation.

The topic page is the center.

Everything else connects to the topic.

The core loop is:

LEARN
 ↓
UNDERSTAND
 ↓
SEE IT
 ↓
INTERACT
 ↓
TROUBLESHOOT
 ↓
PRACTICE
 ↓
ASK AI
 ↓
MASTER


Build the architecture so that this loop works for every HVAC topic.

Most importantly:

Do not hard-code the current topic list.

The owner must be able to add new HVAC equipment, components, concepts, procedures, tools, troubleshooting scenarios, questions, quizzes, diagrams, and AI-grounded content from the admin panel without changing application code.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://welcome-to-hvac.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/db42e652-cc07-4b4b-9fd2-0a98401fe905).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
