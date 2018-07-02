drop function if exists  afi(date);

drop table if exists clusters;
create table clusters(d date,ou varchar,cases bigint,ctype_max varchar,ctype_min varchar,cases_gg varchar[],coord varchar);
    
create or replace function afi(date) returns setof record as '
select d,ou,array_length(array_agg(distinct gg),1) as cases,max(ctype) as ctype_max,min(ctype) as ctype_min,array_agg(distinct gg) as cases_gg,max(coord) as coord
from(

select $$lab$$ as ctype,$1 as d,ou, count(evuid) as cases , array_agg(evuid) cases_gg, max(coord) as coord
from
	(
	select psi.organisationunitid as ou,psi.programstageinstanceid as ev,psi.uid as evuid,psi.executiondate,concat($${"latitude":$$,psi.latitude,$$,"longitude":$$,psi.longitude,$$}$$) as coord
	from trackedentitydatavalue tedv
	inner join programstageinstance psi on psi.programstageinstanceid = tedv.programstageinstanceid
	inner join dataelement de on de.dataelementid = tedv.dataelementid
	where psi.uid not in (select distinct unnest(cases_gg) from clusters)	
	and psi.programstageinstanceid in (select psi.programstageinstanceid 
					from trackedentitydatavalue tedv
					inner join programstageinstance psi on psi.programstageinstanceid = tedv.programstageinstanceid
					inner join dataelement de on de.dataelementid = tedv.dataelementid
					where (de.name = $$id$$ and tedv.value like $$DPHL_Lab_V1$$)
					and psi.executiondate between $1::date - interval $$8 days$$ and $1::date - interval $$1 days$$

	)
	and (	   (de.name = $$Dengue$$ and tedv.value like $$%Positive%$$)
		or (de.name = $$Malaria$$ and tedv.value like $$%Positive%$$)
		or (de.name = $$Leptosprirosis$$ and tedv.value like $$%Positive%$$)
		or (de.name = $$scrub_typhus$$ and tedv.value like $$%Positive%$$))
	and psi.programstageinstanceid not in (
                                               select psi.programstageinstanceid
                                               from trackedentitydatavalue tedv
                                               inner join programstageinstance psi on psi.programstageinstanceid = tedv.programstageinstanceid
                                               inner join dataelement de on de.dataelementid = tedv.dataelementid
                                               where de.name=$$Manual_IsDuplicate$$ and tedv.value=$$true$$
                                              )
	group by psi.organisationunitid,psi.programstageinstanceid,psi.uid
	order by psi.organisationunitid
	
)lab
group by lab.ou

union

select $$afi57$$ as ctype,$1 as d,ou, count(evuid) as cases , array_agg(evuid) as cases_gg, max(coord) as coord
from
	(
	select psi.organisationunitid as ou,psi.programstageinstanceid as ev,psi.uid as evuid,concat($${"latitude":$$,psi.latitude,$$,"longitude":$$,psi.longitude,$$}$$) as coord
	from trackedentitydatavalue tedv
	inner join programstageinstance psi on psi.programstageinstanceid = tedv.programstageinstanceid
	inner join dataelement de on de.dataelementid = tedv.dataelementid
	where concat(de.name,$$:$$,tedv.value) in (values ($$id:eDFSS_IPD_V3$$),($$Diagnosis_Information/Syndrome:AFI$$))
	and psi.executiondate between $1::date - interval $$8 days$$ and $1::date - interval $$1 days$$
	and psi.uid not in (select distinct unnest(cases_gg) from clusters)
        and psi.programstageinstanceid not in (
                                               select psi.programstageinstanceid
                                               from trackedentitydatavalue tedv
                                               inner join programstageinstance psi on psi.programstageinstanceid = tedv.programstageinstanceid
                                               inner join dataelement de on de.dataelementid = tedv.dataelementid
                                               where de.name=$$Manual_IsDuplicate$$ and tedv.value=$$true$$
                                              )
	group by psi.organisationunitid,psi.programstageinstanceid,psi.uid
	having count(psi.programstageinstanceid) = 2
	order by psi.organisationunitid
)afi57
group by afi57.ou
having count(evuid) >= 5

union 

select $$afi35$$ as ctype,$1 as d,ou, count(evuid) as cases , array_agg(evuid) cases_gg,max(coord) as coord
from
	(
	select psi.organisationunitid as ou,psi.programstageinstanceid as ev,psi.uid as evuid,concat($${"latitude":$$,psi.latitude,$$,"longitude":$$,psi.longitude,$$}$$) as coord
	from trackedentitydatavalue tedv
	inner join programstageinstance psi on psi.programstageinstanceid = tedv.programstageinstanceid
	inner join dataelement de on de.dataelementid = tedv.dataelementid
	where concat(de.name,$$:$$,tedv.value) in (values ($$id:eDFSS_IPD_V3$$),($$Diagnosis_Information/Syndrome:AFI$$))
	and psi.executiondate between $1::date - interval $$6 days$$ and $1::date - interval $$1 days$$
	and psi.uid not in (select distinct unnest(cases_gg) from clusters)
        and psi.programstageinstanceid not in (
                                               select psi.programstageinstanceid
                                               from trackedentitydatavalue tedv
                                               inner join programstageinstance psi on psi.programstageinstanceid = tedv.programstageinstanceid
                                               inner join dataelement de on de.dataelementid = tedv.dataelementid
                                               where de.name=$$Manual_IsDuplicate$$ and tedv.value=$$true$$
                                              ) 
	group by psi.organisationunitid,psi.programstageinstanceid,psi.uid
	having count(psi.programstageinstanceid) = 2
	order by psi.organisationunitid
)afi35
group by afi35.ou
having count(evuid) = 3 or count(evuid) = 4 
)clusters, unnest(cases_gg) gg
group by d,ou


union

select d,ou,array_length(array_agg(distinct gg),1) as cases,max(ctype) as ctype_max,min(ctype) as ctype_min,array_agg(distinct gg) as cases_gg,max(coord) as coord
from(
select $$ADD$$::text as ctype,$1::date as d,ou, count(evuid) as cases , array_agg(evuid) cases_gg,max(coord) as coord
from
	(
	select psi.organisationunitid as ou,psi.programstageinstanceid as ev,psi.uid as evuid,concat($${"latitude":$$,psi.latitude,$$,"longitude":$$,psi.longitude,$$}$$) as coord
	from trackedentitydatavalue tedv
	inner join programstageinstance psi on psi.programstageinstanceid = tedv.programstageinstanceid
	inner join dataelement de on de.dataelementid = tedv.dataelementid
	where concat(de.name,$$:$$,tedv.value) in (values ($$id:eDFSS_IPD_V3$$),($$Diagnosis_Information/Syndrome:ADD$$))
	and psi.executiondate between $1::date - interval $$4 days$$ and $1::date - interval $$1 days$$
	and psi.uid not in (select distinct unnest(cases_gg) from clusters)
        and psi.programstageinstanceid not in (
                                               select psi.programstageinstanceid
                                               from trackedentitydatavalue tedv
                                               inner join programstageinstance psi on psi.programstageinstanceid = tedv.programstageinstanceid
                                               inner join dataelement de on de.dataelementid = tedv.dataelementid
                                               where de.name=$$Manual_IsDuplicate$$ and tedv.value=$$true$$
                                              )
	group by psi.organisationunitid,psi.programstageinstanceid,psi.uid
	having count(psi.programstageinstanceid) = 2
	order by psi.organisationunitid
)add23
group by add23.ou
having count(evuid) >= 2 
)addd ,unnest(cases_gg) gg
group by d,ou

' Language sql;

CREATE or replace FUNCTION cs() RETURNS void AS $$
DECLARE
dates date;
curr_date date;

BEGIN
    RAISE NOTICE 'Starting cluster generation...';
    FOR dates IN SELECT generate_series(
                                        date '2016-03-01',
                                        now(),
                                        --  date '2018-07-03',
                                        '1 day'
                                        )dates
    LOOP

    --        RAISE NOTICE 'dates  %...', dates;
    DROP TABLE IF EXISTS inshallah;

    curr_date:=dates;
    execute format('create temporary table inshallah as (select *  from afi(''%s'') as afi(d date,ou integer,cases integer,ctype_max varchar,ctype_min varchar, cases_gg varchar[],coord varchar))',
                   curr_date);
    insert into clusters	select * from inshallah;
    
    END LOOP;

    RAISE NOTICE 'All clusters copied';

END;
$$ LANGUAGE plpgsql;
select cs();

-- drop previous clusters



CREATE or replace FUNCTION deleteClusters() RETURNS void AS $$
DECLARE
tei integer[];
pi integer[];
BEGIN

    select array_agg(trackedentityinstanceid)
    from programinstance 
    where programid = 30835
    into tei;

    select array_agg(programinstanceid)
    from programinstance 
    where programid = 30835
    into pi;

    RAISE NOTICE 'Deleting...%s',tei;
    delete from trackedentityattributevalue where trackedentityinstanceid = any (tei);
    delete from trackedentityattributevalueaudit where trackedentityinstanceid = any (tei);	
    delete from programstageinstance where programinstanceid = any(pi);
    delete from programinstance where programinstanceid = any (pi);
    delete from trackedentityinstance where trackedentityinstanceid = any (tei);
    RAISE NOTICE 'Deleted ';

END;
$$ LANGUAGE plpgsql;

select deleteClusters();

-- 

drop function if exists make_clusters();
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
    FOR c IN SELECT * from clusters order by d desc
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
    --	RAISE NOTICE 'tei  %',tei;

    INSERT INTO trackedentityattributevalue(
                                            trackedentityinstanceid, trackedentityattributeid, created, lastupdated, value, encryptedvalue)
    VALUES (tei , 30845, now(), now(), c.ctype_max, null),
    (tei, 30844, now(), now(), concat('CLUSTER',i,'_',c.d), null),
    (tei, 85464, now(), now(), concat(array_to_string(c.cases_gg,';'),';'), null),
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
                    
                    --	RAISE NOTICE 'Saved cluster  %...%', c,tei;
                    
                    END LOOP;

                    RAISE NOTICE 'Done';

                END;
                $$ LANGUAGE plpgsql;


select make_clusters();

select count(*) from clusters;
