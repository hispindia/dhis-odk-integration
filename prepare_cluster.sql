
--drop function cs();
--drop function afi(date);


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
	and psi.executiondate between $1::date - interval $$8 days$$ and $1::date - interval $$1 days$$
	and psi.uid not in (select distinct unnest(cases_gg) from clusters)
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
    drop table if exists clusters;
    create table clusters(d date,ou varchar,cases bigint,ctype_max varchar,ctype_min varchar,cases_gg varchar[],coord varchar);
    FOR dates IN SELECT generate_series(
                                        date '2016-01-01',
                                        now(),
                                      --  date '2018-07-03',
                                        '1 day'
                                        )dates
    LOOP

                RAISE NOTICE 'dates  %...', dates;
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

select * from clusters where 'Ocff640bec9' = any (cases_gg);
select * from clusters order by d;
