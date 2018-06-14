--drop function make_clusters();
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE or replace FUNCTION make_clusters() RETURNS void AS $$
DECLARE
tei integer;
enrollment integer;
psi integer;
c record;
i integer;
uid varchar;
casesuid varchar;
BEGIN
    RAISE NOTICE 'Starting cluster generation...';
    i:=0; 	
    FOR c IN SELECT * from clusters limit 1
    LOOP
	i:=i+1;
	SELECT concat('C',right(uuid_generate_v4()::text,10)) into uid;
	INSERT INTO trackedentityinstance(
            trackedentityinstanceid, uid, code, created, lastupdated, lastupdatedby, 
            createdatclient, lastupdatedatclient, inactive, deleted, representativeid, 
            organisationunitid, trackedentityid)
	VALUES (nextval('hibernate_sequence'),uid , null, now(), now(), 50, 
            now(), now(), false, false, null, 
            c.ou::integer, 30833)
            returning trackedentityinstanceid into tei;

        SELECT concat('E',right(uuid_generate_v4()::text,10)) into uid;	
	INSERT INTO programinstance(
            programinstanceid, uid, created, lastupdated, createdatclient, 
            lastupdatedatclient, incidentdate, enrollmentdate, enddate, followup, 
            completedby, longitude, latitude, deleted, status, trackedentityinstanceid, 
            programid, organisationunitid)
	VALUES (nextval('hibernate_sequence'), uid, now(), now(), now(), 
		now(), now(), now(), null, false, 
		null, null, null, false, 'ACTIVE', tei, 
		30835, c.ou::integer)
		returning programinstanceid into enrollment;
	RAISE NOTICE 'tei  %',tei;

	INSERT INTO trackedentityattributevalue(
		trackedentityinstanceid, trackedentityattributeid, created, lastupdated, value, encryptedvalue)
	VALUES (tei , 30845, now(), now(), c.ctype_max, null),
		(tei, 30844, now(), now(), concat('CLUSTER',i,'_',c.d), null),
		(tei, 85464, now(), now(), array_to_string(c.cases_gg,';'), null),
		(tei, 85550, now(), now(), 'FIXED', null),
		(tei, 16346756, now(), now(), c.d, null),
		(tei, 16211617, now(), now(), c.d, null),
		(tei, 16211616, now(), now(), c.d, null), 
		(tei, 30846, now(), now(), 'POINT', null),
		(tei, 30843, now(), now(), c.coord, null),
		(tei, 30847, now(), now(), true, null);

	if c.ctype_max = 'lab' then
		INSERT INTO trackedentityattributevalue(
			trackedentityinstanceid, trackedentityattributeid, created, lastupdated, value, encryptedvalue)
		VALUES (tei , 30839, now(), now(), true, null);	
	end if;	

	if c.ctype_max = 'afi35' then
		INSERT INTO trackedentityattributevalue(
			trackedentityinstanceid, trackedentityattributeid, created, lastupdated, value, encryptedvalue)
		VALUES (tei , 30841, now(), now(), true, null);	
	end if;	
		
	if c.ctype_max = 'afi57' then
		INSERT INTO trackedentityattributevalue(
			trackedentityinstanceid, trackedentityattributeid, created, lastupdated, value, encryptedvalue)
		VALUES (tei , 30842, now(), now(), true, null);	
	end if;	

	if c.ctype_max = 'ADD' then
		INSERT INTO trackedentityattributevalue(
			trackedentityinstanceid, trackedentityattributeid, created, lastupdated, value, encryptedvalue)
		VALUES (tei , 30840, now(), now(), true, null);	
	end if;	

        SELECT concat('S',right(uuid_generate_v4()::text,10)) into uid;	
	INSERT INTO public.programstageinstance(
            programstageinstanceid, uid, code, created, lastupdated, createdatclient, 
            lastupdatedatclient, programinstanceid, programstageid, attributeoptioncomboid, 
            deleted, storedby, duedate, executiondate, organisationunitid, 
            status, longitude, latitude, completedby, completeddate)
	VALUES (nextval('hibernate_sequence'), uid, null, now(), now(), now(), 
		now(), enrollment, 30837, 19, 
		false, 'admin', now(), now(), c.ou::integer, 
		'COMPLETED', null, null, 'admin', now());

	
		    
	RAISE NOTICE 'cluster  %...%', c,tei;
		
    END LOOP;

    RAISE NOTICE 'Done';

END;
$$ LANGUAGE plpgsql;

select make_clusters();
