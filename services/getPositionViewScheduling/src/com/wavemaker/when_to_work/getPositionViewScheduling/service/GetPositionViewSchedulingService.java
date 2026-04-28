package com.wavemaker.when_to_work.getPositionViewScheduling.service;


import com.wavemaker.when_to_work.getPositionViewScheduling.model.*;
import com.wavemaker.when_to_work.getPositionViewScheduling.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface GetPositionViewSchedulingService {

  /**
   * 
   * 
    * @param Authorization Authorization (optional)
    * @param positionIds positionIds (optional)
    * @param companyId companyId (optional)
    * @param categoryIds categoryIds (optional)
    * @param endDate endDate (optional)
    * @param startDate startDate (optional)
   * @return RootResponse
   */
  @RequestLine("GET /scheduling/shifts/date-position?positionIds={positionIds}&companyId={companyId}&categoryIds={categoryIds}&endDate={endDate}&startDate={startDate}")
  @Headers({
    "Accept: application/json",
    "Authorization: {Authorization}"  })
  RootResponse invoke(@Param("Authorization") String Authorization, @Param("positionIds") String positionIds, @Param("companyId") String companyId, @Param("categoryIds") String categoryIds, @Param("endDate") String endDate, @Param("startDate") String startDate);


    /**
     * 
     * 
     * Note, this is equivalent to the other <code>invoke</code> method,
     * but with the query parameters collected into a single Map parameter. This
     * is convenient for services with optional query parameters, especially when
     * used with the {@link InvokeQueryParams} class that allows for
     * building up this map in a fluent style.
     * @param Authorization Authorization (optional)
     * @param queryParams Map of query parameters as name-value pairs
     *   <p>The following elements may be specified in the query map:</p>
     *   <ul>
     *   <li>positionIds - positionIds (optional)</li>
     *   <li>companyId - companyId (optional)</li>
     *   <li>categoryIds - categoryIds (optional)</li>
     *   <li>endDate - endDate (optional)</li>
     *   <li>startDate - startDate (optional)</li>
     *   </ul>
     * @return RootResponse
     */
    @RequestLine("GET /scheduling/shifts/date-position?positionIds={positionIds}&companyId={companyId}&categoryIds={categoryIds}&endDate={endDate}&startDate={startDate}")
    @Headers({
    "Accept: application/json",
        "Authorization: {Authorization}"    })
    RootResponse invoke
    (@Param("Authorization") String Authorization, @QueryMap(encoded=true)
    MultiValueMap<String, String> queryParams);

}
