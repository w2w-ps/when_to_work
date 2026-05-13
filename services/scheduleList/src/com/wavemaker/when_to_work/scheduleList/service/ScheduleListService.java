package com.wavemaker.when_to_work.scheduleList.service;


import com.wavemaker.when_to_work.scheduleList.model.*;
import com.wavemaker.when_to_work.scheduleList.model.ResponseRootResponseROOTEntryItem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface ScheduleListService {

  /**
   * 
   * 
    * @param positionIds positionIds (optional)
    * @param companyId companyId (optional)
    * @param categoryIds categoryIds (optional)
    * @param endDate endDate (optional)
    * @param startDate startDate (optional)
    * @param status status (optional)
   * @return List&lt;ResponseRootResponseROOTEntryItem&gt;
   */
  @RequestLine("GET /scheduling/shifts/employees?positionIds={positionIds}&companyId={companyId}&categoryIds={categoryIds}&endDate={endDate}&startDate={startDate}&status={status}")
  @Headers({
    "Accept: application/json",  })
  List<ResponseRootResponseROOTEntryItem> invoke(@Param("positionIds") String positionIds, @Param("companyId") String companyId, @Param("categoryIds") String categoryIds, @Param("endDate") String endDate, @Param("startDate") String startDate, @Param("status") String status);


    /**
     * 
     * 
     * Note, this is equivalent to the other <code>invoke</code> method,
     * but with the query parameters collected into a single Map parameter. This
     * is convenient for services with optional query parameters, especially when
     * used with the {@link InvokeQueryParams} class that allows for
     * building up this map in a fluent style.
     * @param queryParams Map of query parameters as name-value pairs
     *   <p>The following elements may be specified in the query map:</p>
     *   <ul>
     *   <li>positionIds - positionIds (optional)</li>
     *   <li>companyId - companyId (optional)</li>
     *   <li>categoryIds - categoryIds (optional)</li>
     *   <li>endDate - endDate (optional)</li>
     *   <li>startDate - startDate (optional)</li>
     *   <li>status - status (optional)</li>
     *   </ul>
     * @return List&lt;ResponseRootResponseROOTEntryItem&gt;
     */
    @RequestLine("GET /scheduling/shifts/employees?positionIds={positionIds}&companyId={companyId}&categoryIds={categoryIds}&endDate={endDate}&startDate={startDate}&status={status}")
    @Headers({
    "Accept: application/json",    })
    List<ResponseRootResponseROOTEntryItem> invoke
    (@QueryMap(encoded=true)
    MultiValueMap<String, String> queryParams);

}
