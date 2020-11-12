import React from "react";
import { useWatch } from "react-hook-form";
export default function SeasonFormComponent({ useFormObj, monthsRef }) {
  const {
    register,
    handleSubmit,
    errors,
    setError,
    watch,
    getValues,
    clearErrors,
    control,
  } = useFormObj;

  // const watchNoSeason = watch("no_season");
  // const watchUnknownSeason = watch("unknown_season");
  //use watch to isolate re-renders to this component
  const {no_season,unknown_season} = useWatch({
    control,
    name: ["no_season", "unknown_season"],
	});

	const disableField = (no_season || unknown_season)

	const validateSeason = (e) => {
		console.log("hits validate season");
    const season = getValues(['no_season', 'unknown_season', 'season_stop', 'season_start']);
		const { no_season, unknown_season, season_stop, season_start } = season
		// console.log(no_season, unknown_season, season_stop, season_start)
		console.log(season)
		if (no_season && unknown_season) {
      console.log("hits both checkbox error");
      setError("season", {
        type: "required",
        message: 'Please select only one of "No Season" or "Unknown"',
      });
      // return;
    } else if (
      !no_season &&
      !unknown_season &&
      (season_stop === "" || season_start === "")
    ) {
      console.log("hits neither checkbox error - add range");
      setError("season", {
        type: "required",
        message:
          'Please select a complete season range or one of "No Season" or "Unknown"',
      });
      // return;
    } else {
      console.log("hits else - clear errors");
      clearErrors('season');
		}
		console.log('errors', errors)
		console.log(errors.season)
    // return false;
  };
  // console.log(watchNoSeason, watchUnknownSeason);
  console.log("re-renders season component");
  return (
    <div className="add-loc__el add-loc__el-col">
      <div className="add-loc__el-row">
        <div className="add-loc__label">Season</div>

        <div>
          <input
            ref={register}
            onChange={validateSeason}
            type="checkbox"
            name="no_season"
            id="no_season"
          />
          <label className="add-loc__label" htmlFor="no_season">
            No Season
          </label>
        </div>
        <div>
          <input
            ref={register}
            onChange={validateSeason}
            type="checkbox"
            name="unknown_season"
            id="unknown_season"
          />
          <label className="add-loc__label" htmlFor="unknown_season">
            Unknown
          </label>
        </div>
      </div>
      {/* I think we will cahnge this to only errors.season_end */}
      {errors.season && (
        <div className="add-loc__err">
          {/* {errors.no_season.message}
							...
							{errors.unknown_season.message}
							...
							{errors.season_start.message}
							... */}
          {errors.season.message}
        </div>
      )}
      <div className="add-loc__sub-label">
        When can the source be harvested? Leave blank if you don't know.
      </div>
      <div className="add-loc__el-row">
        <select
          ref={register}
          onChange={validateSeason}
          className="add-loc__pos"
          name="season_start"
          id="season_start"
          disabled={disableField}
        >
          <option className="invalid" value="" disabled hidden>
            Start
          </option>

          {monthsRef.current.map(([monthId, monthName], idx) => (
            <option key={idx} value={monthId}>
              {monthName}
            </option>
          ))}
        </select>
        <div className="add-loc__pos-spacer" />
        <select
          // we leave validation here, on last season input, so it is only run once
          // NO - we do it on all four so error updates - but we put it in it's own component so only this piece rerenders
          ref={register}
          onChange={validateSeason}
          className="add-loc__pos"
          name="season_stop"
          id="season_stop"
          disabled={disableField}
        >
          <option className="invalid" value="" disabled hidden>
            End
          </option>

          {monthsRef.current.map(([monthId, monthName], idx) => (
            <option key={idx} value={monthId}>
              {monthName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}